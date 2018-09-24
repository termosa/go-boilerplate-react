<% if (framework) { %>import '<%= framework %>';
<% } %>import './App.css';
import React from 'react';
<% if (router) {
%>import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';<% } %>

import {
  /* import pages */
  NotFoundPage
} from './components';

const App = () => (
  <% if (router) {
  %><Router>
    <div className="App">
      <Switch>
        /* define pages */
        <Route component={NotFoundPage} />
      </Switch>
    </div>
  </Router><% } else {
  %><div className="App">
    <NotFoundPage />
  </div><% } %>
);

export default App;
