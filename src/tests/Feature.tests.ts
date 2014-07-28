import razor = require('../Razor');

QUnit.module('Feature tests');

test('sample', function(){
  var model = {
    title: 'Hobbits',
    current: 'Frodo',
    items: [
      'Bilbo',
      'Fredegar',
      'Frodo',
      'Meriadoc',
      'Peregrin',
      'Samwise',
    ]
  },
  input = '<h2>@model.title</h2>\
  <ul>\
    @for(var i=0;i<model.items.length;++i) {\
      <li class="@(model.items[i] == model.current ? \'is-current\' : \'\')">@model.items[i]</li>\
    }\
  </ul>',
  expected = '<h2>Hobbits</h2>\
  <ul>\
      <li>Bilbo</li>\
      <li>Fredegar</li>\
      <li class="is-current">Frodo</li>\
      <li>Meriadoc</li>\
      <li>Peregrin</li>\
      <li>Samwise</li>\
  </ul>';

var view = razor.transpile(input),
    instance = new view(),
    output = instance.execute(model);

  equal(output, expected);
});
