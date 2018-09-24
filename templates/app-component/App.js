<% if (framework) { %>import '<%= framework %>';
<% } %>import './App.css';
import React, { Component } from 'react';
<% if (router) {
%>import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';

const EmptyPage = () => (
  <p>
    <%= message %>
  </p>
);<% } %>

const App = () => (
  <% if (router) {
  %><Router>
    <div className="App">
      <Switch>
        <Route path="*" exact={true} component={EmptyPage} />
      </Switch>
    </div>
  </Router><% } else {
  %><div className="App">
    <p>
      <%= message %>
    </p>
  </div><% } %>
);

export default App;
