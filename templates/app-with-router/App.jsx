import './App.css';
import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';

const EmptyPage = () => (
  <p>
    To get started, edit <code>src/App.jsx</code> and save to reload.
  </p>
);

const App = () => (
  <Router>
    <div className="App">
      <Switch>
        <Route path="*" exact={true} component={EmptyPage} />
      </Switch>
    </div>
  </Router>
);

export default App;
