#RazorScript

I like Razor and wanted to use it in JavaScript, so I've started this project
in order to do so. The markup is parsed and transpiled into a JavaScript class
that can be instantiated and executed with a viewmodel.

##Usage

#####MyFirstView.jshtml

```js
<h2>@model.title</h2>
<ul>
  @for(var i=0;i<model.items.length;++i) {
    listItem(model.items[i]);
  }
</ul>

@helper listItem(name) {
  <li class="@(name == model.current ? 'is-current' : '')">@name</li>
}
```


#####Code

```js
var razor = require('./razor.js'),
    view = razor.transpileFile('MyFirstView.jshtml'),
    model = {
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
    }
    instance = new view(model),
    output = instance.execute();
```

#####The output

```html
<h2>Hobbits</h2>
<ul>
  <li>Bilbo</li>
  <li>Fredegar</li>
  <li class="is-current">Frodo</li>
  <li>Meriadoc</li>
  <li>Peregrin</li>
  <li>Samwise</li>
</ul>
```
