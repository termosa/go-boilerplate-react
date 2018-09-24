<% if (needCss) { %>import './<%= name %>.css';
<% } %>
import React from 'react';

const <%= name %> = () => (
  <div<% if (needCss) { %> className="<%= name %>"<% } %>>
    This is the <code>src/components/<%= name %>/<%= name %>.js</code> in work!
  </div>
);

export default <%= name %>;
