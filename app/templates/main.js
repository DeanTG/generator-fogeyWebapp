<% if (includeRequirejs) { %>

requirejs.config({
  baseUrl: 'js/lib',
  paths: {
    // bowerpath:js
    //bower_path
    // endbower
  },
  <% if (includeBootstrap) { %>
  shim:{
    'bootstrap':{  
      'deps':['jquery']  
    }  
  },
  <% } -%>
});
requirejs([''], function() {});

<% } else {-%>
$(function(){

})
<% } -%>