<% if (includeRequirejs) { %>
requirejs.config({
  paths: {
    // bower:js
    // bowerfilepath
    // endbower
  },
  shim:{
    <% if (includeBootstrap) { %>
    'bootstrap': ['jquery']  
    <% } -%> 
  },
});
requirejs(['jquery'], function($) {});
<% } else {-%>
$(function(){

})
<% } -%>