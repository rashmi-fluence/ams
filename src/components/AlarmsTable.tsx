import React, {useEffect, useState} from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles'; 
import {Container, TablePagination} from '@material-ui/core';
import Table from '@material-ui/core/Table'; 
import TableBody from '@material-ui/core/TableBody'; 
import TableCell from '@material-ui/core/TableCell'; 
import TableContainer from '@material-ui/core/TableContainer'; 
import TableHead from '@material-ui/core/TableHead'; 
import TableRow from '@material-ui/core/TableRow'; 
import Paper from '@material-ui/core/Paper';
import apiHandler from '../../pages/api/handler';


const useStyles = makeStyles((theme) => ({
   table: {
    minWidth: 700,
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    [theme.breakpoints.down('sm')]: {
      // for mobile
      display: 'none',
    },
  },

  head: {
    backgroundColor: theme.palette.background.red
  }
}));


const StyledTableCell = withStyles((theme) => ({
  root: {
    borderBottom: "1px solid #fff",
    borderRight: "1px solid #fff"
  },
   head: {
    backgroundColor: '#0b5394',
    color: theme.palette.common.white,
    fontWeight: 400,
    fontSize: 16
   },
   body: {
      fontSize: 14,
   }


}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
   root: {
      '&:nth-of-type(odd)': {
         backgroundColor: '#c6dbef',
      },
       '&:nth-of-type(even)': {
         backgroundColor: '#d7e3ed',
      },
   },
}))(TableRow);

export default function AlarmsTable({items}) {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

 const handlePageChange = (event, page) => {
    setPage(page);
  };
  const handleRowsPerPageChange = event => {
    setRowsPerPage(event.target.value);
  };


  console.log("In alarms table " + JSON.stringify(items));
  let lists = [];
  if(items.length > 0){
		 lists = items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => {
      console.log(item);

	   return (
      <StyledTableRow key={item[0]}>
      <StyledTableCell component="th" scope="row">
           {item[0]}
        </StyledTableCell>
	      <StyledTableCell component="th" scope="row">
	         {item[1]}
	      </StyledTableCell>
	      <StyledTableCell align="right">{item[4]}</StyledTableCell>
	      <StyledTableCell align="right">
	         {item[3]}
	      </StyledTableCell>
	      <StyledTableCell align="right">{item[2]}</StyledTableCell>
	   </StyledTableRow>
     );
   }
		);
  }


 

  return (
  <Container maxWidth={false} className={classes.contentContainer}>

    <TableContainer component={Paper} style={{maxHeight: '90vh'}}>
   <Table  aria-label="customized table" className={classes.table} stickyHeader>
      <TableHead className={classes.head}>
         <TableRow>
          <StyledTableCell>Id</StyledTableCell>
            <StyledTableCell>Title</StyledTableCell>
            <StyledTableCell align="right">Amount</StyledTableCell>
            <StyledTableCell align="right">Spend date</StyledTableCell>
            <StyledTableCell align="right">Category</StyledTableCell>
         </TableRow>
      </TableHead>
      <TableBody>
         {lists}
      </TableBody>
   </Table>
</TableContainer>
  <TablePagination
            component="div"
            count={items.length}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsPerPageChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
      </Container>
  );
}


// export async function getStaticProps(context) {
//   const res = await fetch(`http://localhost:3000/api/handler`);
//   const alarms = await res.json();
//   return {
//     props: {
//       alarms
//     }, // will be passed to the page component as props
//   }
// }