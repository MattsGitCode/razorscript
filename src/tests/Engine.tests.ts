/// <reference path="../typings/node.d.ts" />
import razor = require('../Razor');
import fs = require('fs');

QUnit.module('Engine tests');

function createContentProvider(views: { [path: string]: string }): (path: string) => string {
  return function(path: string) {
    return views[path];
  };
}

test('helper methods available in views', function() {
  var source = '@html.sayHello("George")',
      provider = createContentProvider({ 'test': source }),
      viewEngine = new razor.ViewEngine({ viewContentsProvider: provider });
  viewEngine.helpers.sayHello = function(name) {
    return 'Hello, ' + name + '.';
  };
  var output = viewEngine.renderView('test', null, null);

  equal('Hello, George.', output);
});
