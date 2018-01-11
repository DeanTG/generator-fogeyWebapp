<% if (includeRequirejs) { %>
requirejs.config({
  paths: {
    // bower:js
    // bowerfilepath
    // endbower
  },
  shim:{
    <% if (includeBootstrap) { %>
    'bootstrap':{  
      'deps':['jquery']  
    } 
    <% } -%> 
  },
});
requirejs(['jquery'], function($) {});
<% } else {-%>
$(function(){

})
<% } -%>