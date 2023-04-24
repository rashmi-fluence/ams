import React from 'react';
import AlarmTable from "../src/components/AlarmsTable";
import { continuousReadMessages, populateStream } from "../src/services/RedisService";
import { createConnection } from '../lib/db';


export default function HomePage({items}) {
  return (
    <AlarmTable items={items} />
  );
}

export async function getServerSideProps(context) {
  await createConnection();
    await populateStream();
    
    console.log("fetching from stream");
    continuousReadMessages();
     console.log("End of fetchmessages---------");

  const res = await fetch(`http://localhost:3000/api/handler`);
  // console.log(res);
  const items = await res.json();
  // console.log(`Printing: ${JSON.stringify(items)}`);
  return {
    props: {
      items
    }, // will be passed to the page component as props
  }
}