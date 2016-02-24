/// <reference path="typings/node.d.ts" />
/// <reference path="typings/extend.d.ts" />
import TokenIterator = require('./tokens/TokenIterator');
import Parser = require('./parser/Parser');
import Transpiler = require('./transpiler/Transpiler');
import HtmlString = require('./transpiler/HtmlString');
import IView = require('./IView');
import IConfig = require('./IConfig');
import fs = require('fs');
import path = require('path');
var extend = require('extend');

export function transpile(razorMarkup: string, config?: IConfig): new (model?: any) => IView {
  var tokenIterator = new TokenIterator(razorMarkup),
      parser = new Parser(tokenIterator),
      transpiler = new Transpiler(parser, config),
      viewClass = transpiler.transpile();

  return viewClass;
}

export function transpileFile(razorPath: string): new (model?: any) => IView {
  var source = fs.readFileSync(razorPath, {encoding: 'utf8'});
  var viewClass = transpile(source);
  return viewClass;
}

export interface IViewEngineOptions extends IConfig {
  viewContentsProvider?: (path: string) => string;
}

var defaultViewEngineOptions = {
  viewContentsProvider: (view) => {
    if (fs.existsSync(view)) {
      return fs.readFileSync(view, {encoding: 'utf8'});
    }
    return null;
  }
};

export class ViewEngine {
  private options: IViewEngineOptions;
  private views: { [path: string]: new (model?: any) => IView };
  public helpers: any;

  constructor(options?: IViewEngineOptions) {
    this.options = extend(null, defaultViewEngineOptions, options);
    this.views = {};
    this.helpers = {};
  }

  public renderView(viewName: string, model: any, viewBag: any, bodyOfLayout?: string, viewRelativeTo?: string): string {
    if (viewRelativeTo) {
      viewName = path.join(path.dirname(viewRelativeTo), viewName);
    }

    if (this.views[viewName] === undefined) {
      var viewContents = this.options.viewContentsProvider(viewName);
      if (!viewContents) {
        throw new Error('could not find view ' + viewName);
      }
      var viewClass = transpile(viewContents, this.options);
      this.views[viewName] = viewClass;
    }

    var renderedView: string;

    var view = new this.views[viewName](model);

    for (var helper in this.helpers) {
      if (this.helpers.hasOwnProperty(helper)) {
        view.helpers[helper] = this.helpers[helper];
      }
    }

    if (viewBag) {
      (<any>view).viewBag = viewBag;
    }

    if (bodyOfLayout) {
      (<any>view).renderBody = function() {
        return new HtmlString(bodyOfLayout);
      };
    }

    renderedView = view.execute();

    if (view.layout) {
      renderedView = this.renderView(view.layout, view, viewBag, renderedView, viewName);
    }

    return renderedView;
  }
}
