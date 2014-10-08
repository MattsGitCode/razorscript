#RazorScript

I like Razor and wanted to use it in JavaScript, so I've started this project
in order to do so. The markup is parsed and transpiled into a JavaScript class
that can be instantiated and executed with a viewmodel.

##Usage

#####Layout.jshtml
```js
<html>
<body>
  <header>
    @renderSection('header')
  </header>
  @renderBody()
</body>
</html>
```

#####MyFirstView.jshtml

```js
@{
  layout = 'Layout.jshtml';
}

@section header {
  <h2>@model.title</h2>
}

<ul>
  @foreach(var name in model.items) {
    @listItem(name);
  }
</ul>

@helper listItem(name) {
  <li class="@(name == model.current ? 'is-current' : '')">@name</li>
}
```


#####Code

```js
var razor = require('razorscript'),
    viewEngine = new razor.ViewEngine(),
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
    },
    output = viewEngine.renderView('MyFirstView.jshtml', model);

```

#####The output

```html
<html>
<body>
<header>
  <h2>Hobbits</h2>
</header>
<ul>
  <li>Bilbo</li>
  <li>Fredegar</li>
  <li class="is-current">Frodo</li>
  <li>Meriadoc</li>
  <li>Peregrin</li>
  <li>Samwise</li>
</ul>
</body>
</html>
```
