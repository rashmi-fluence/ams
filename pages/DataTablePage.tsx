import React from "react";
import { makeStyles } from "@material-ui/core/styles";

import Toolbar from "../src/components/Toolbar";
import AlarmsTable from "../src/components/AlarmsTable";
import { createConnection } from '../lib/db';


const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  },
  content: {
    marginTop: 15
  },
}));

const DataTablePage = ({items}) => {
  const classes = useStyles();
  const tabs = ['All', 'Shipped', 'Processing', 'Completed'];
  const [statusFilter, setStatusFilter] = React.useState(0);

  const query = {
    "limit": 500,
    "timeDimensions": [
      {
        "dimension": "Orders.createdAt",
        "granularity": "day"
      }
    ],
    "dimensions": [
      "Users.id",
      "Orders.id",
      "Orders.size",
      "Users.fullName",
      "Users.city",
      "Orders.price",
      "Orders.status",
      "Orders.createdAt"
    ],
    "filters": [
      {
        "dimension": "Orders.status",
        "operator": tabs[statusFilter] !== 'All' ? "equals" : "set",
        "values": [
          `${tabs[statusFilter].toLowerCase()}`
        ]
      }
    ]
  };

  return (
    <div className={classes.root}>
      <Toolbar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        tabs={tabs}
      />
      <div className={classes.content}>
        <AlarmsTable
        items={items}
          query={query}/>
        }
      </div>
    </div>
  );
};



export async function getServerSideProps(context) {
  await createConnection();
    // await populateStream();
    
    // console.log("fetching from stream");
    // continuousReadMessages();
    //  console.log("End of fetchmessages---------");

  const res = await fetch(`http://localhost:3000/api/handler`);
  console.log(res);
  const items = await res.json();
  console.log(`Printing: ${JSON.stringify(items)}`);
  return {
    props: {
      items
    }, // will be passed to the page component as props
  }
}
export default DataTablePage;