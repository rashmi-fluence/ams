import "date-fns";
import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import withStyles from "@material-ui/core/styles/withStyles";
// import palette from "../theme/palette";

const AntTabs = withStyles((theme) => ({
  root: {
    borderBottom: `1px solid ${theme.palette.primary.main}`,
  },
  indicator: {
    backgroundColor: `${theme.palette.primary.main}`,
  },
}))(Tabs);
const AntTab = withStyles((theme) => ({
  root: {
    textTransform: 'none',
    minWidth: 25,
    // fontSize: 12,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(0),
    color: theme.palette.primary.dark,
    opacity: 0.6,
    '&:hover': {
      color: `${theme.palette.primary.main}`,
      opacity: 1,
    },
    '&$selected': {
      color: `${theme.palette.primary.main}`,
      fontWeight: theme.typography.fontWeightMedium, 
      outline: 'none',
    },
    '&:focus': {
      color: `${theme.palette.primary.main}`,
      outline: 'none',
    },
  },
  selected: {},
}))((props) => <Tab disableRipple {...props} />);
const useStyles = makeStyles(theme => ({
  root: {},
  row: {
    marginTop: theme.spacing(1)
  },
  spacer: {
    flexGrow: 1
  },
  importButton: {
    marginRight: theme.spacing(1)
  },
  exportButton: {
    marginRight: theme.spacing(1)
  },
  searchInput: {
    marginRight: theme.spacing(1)
  },
  formControl: {
    margin: 25,
    fullWidth: true,
    display: "flex",
    wrap: "nowrap"
  },
  date: {
    marginTop: 3
  },
  range: {
    marginTop: 13
  }
}));

const Toolbar = props => {
  const { className,
    statusFilter,
    setStatusFilter,
    tabs,
    ...rest } = props;
  const [tabValue, setTabValue] = React.useState(statusFilter);

  const classes = useStyles();

  const handleChangeTab = (e, value) => {
    setTabValue(value);
    setStatusFilter(value);
  };

  return (
    <div
      {...rest}
      className={clsx(classes.root, className)}
    >
      <Grid container spacing={4}>
        <Grid
          item
          lg={6}
          sm={6}
          xl={3}
          xs={12}
          m={2}
        >
          <div className={classes}>
            <AntTabs value={tabValue} onChange={(e,value) => {handleChangeTab(e,value)}} aria-label="ant example">
              {tabs.map((item) => (<AntTab key={item} label={item} />))}
            </AntTabs>
            <Typography className={classes.padding} />
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

Toolbar.propTypes = {
  className: PropTypes.string
};

export default Toolbar;