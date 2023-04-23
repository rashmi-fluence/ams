// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import React, { useState } from 'react';
import type { NextApiRequest, NextApiResponse } from 'next';
import { addToStream, getStreamMessageGenerator, connectToRedis, isAlive, getMultipleNewMessages, parseMessage, continuousReadMessages } from '../../src/services/RedisService';
// import { createClient } from 'redis';
import { executeQuery, redis, db, createConnection } from '../../lib/db';

type Data = {
  name: string
}

// export default async function apiHandler(
//   req: NextApiRequest,
//   res: NextApiResponse<Data>
// ) {

//     await connectToRedis();
   

//  // await populateStream();
//   // var results = await continuousReadMessages();
//     // var results = await getMultipleNewMessages(10);
//   console.log(results);

//   res.status(200).json(results)
// }

/**
   * For example purposes, this will add a new message to the stream every second.
   */
   function populateStream() {

    const interval = setInterval(async () => {
              console.log("----------------populating stream--------")

       addToStream(
        {
          'id': Date.now() + 2,
          'name': "hello",
          'category': 'warning',
          'spendDate': new Date(),
          'amount': { num: Date.now() % 100 },
        },
        'EXAMPLE_STREAM_NAME',
      );
    }, 1000);
  }


export default async function fetchMessages(
   req: NextApiRequest,
    res: NextApiResponse<Data>) {

    // await populateStream();
    
    // console.log("fetching from stream")
    // while(true){
    //           console.log("----------------insert into redis  stream--------")

    //   await getMultipleNewMessages(10).then((results) => console.log("from Redis " + JSON.stringify(results)));

    // }
    // await continuousReadMessages();


    console.log("**********************");
    var db;
    
    db = await createConnection();
    
    const [results] = await db.execute('SELECT * FROM alerts', []);
    db.end();
    console.log("in fetchMessages----" + JSON.stringify(results));
    
    
    
    res.status(200).json(results);
}


  
