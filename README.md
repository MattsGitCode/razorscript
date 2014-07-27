#TypeScript Razor

I like Razor and wanted to use it in JavaScript, so I've started this project
in order to do so. The markup is parsed and transpiled into a JavaScript class
that can be instantiated and executed with a viewmodel.

##Usage

    var razor = require('./razor.js'),
      view = razor.transpile('@for(var i = 0; i < 10; ++i){ <p>@i</p>}'),
      instance = new view(),
      output = instance.execute();
