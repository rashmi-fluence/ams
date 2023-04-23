import mysql from 'mysql2/promise';
import { createClient } from 'redis';

let db;

// db.connect((err)=> {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("connected to db");
//   }
// });

async function createConnection() {
  db = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
    rowsAsArray: true,
});
 return db;
}


const redis = createClient({ url: process.env.REDIS_URL });

module.exports = {
  redis,
  db,
  insertDB,
  executeQuery,
  createConnection
}


 async function executeQuery(query, values) {
  try {
      // const results = new Promise(function(resolve, reject) { 

       const results =  await db.query(query, values);
        // db.end();
        // return resolve(results);
      // });
       return results;
      
  } catch (error) {
    return { error };
  }
}


 async function insertDB(messages, idsArray) {
     // insert into database
    console.log("--------");
    console.log(...messages.map((e) => [e.id, e.name, e.category, e.spendDate, e.amount]));
    
    console.log("inserting");
    var query = "CREATE TABLE IF NOT EXISTS alerts (id bigint not null auto_increment, name varchar(255) not null, category varchar(255), spendDate varchar(255), amount decimal(5,2), primary key (id) )";
    
    await executeQuery(query, []);
    console.log(messages.length);
    if(messages.length > 0) {
      try {
        console.log("------------in insertDB--------------");
        const result = executeQuery(
            'INSERT INTO alerts(id, name, category, spendDate, amount) VALUES ?',
            [messages.map((e) => [e.id, e.name, e.category, e.spendDate, e.amount])],
        ).then((result) => {

          console.log( "ttt",result );

          // remove from stream
          for(const id of idsArray) {
            console.log("Deleting" + id);

            const response = redis.xDel(
              'EXAMPLE_STREAM_NAME',
               id);

          }
        

          });
      } catch ( error ) {
          console.log( error );
      }
    }
  }
