<% if (includeRequirejs) { %>
requirejs.config({
  baseUrl: 'assets/libs/',
  paths: {
    <% if (includeBootstrap) { %>
    'bootstrap': '',
    <% } -%>
    'jquery': ''
  },
  
  shim:{
    <% if (includeBootstrap) { %>
    'bootstrap':{  
      'deps':['jquery']  
    } 
    <% } -%> 
  },
});
requirejs([''], function() {});
<% } else {-%>
$(function(){

})
<% } -%>