/// <reference path="typings/node.d.ts" />
/// <reference path="typings/extend.d.ts" />
import TokenIterator = require('./tokens/TokenIterator');
import Parser = require('./parser/Parser');
import Transpiler = require('./transpiler/Transpiler');
import HtmlString = require('./transpiler/HtmlString');
import IView = require('./IView');
import fs = require('fs');
import path = require('path');
var extend = require('extend');

export function transpile(razorMarkup: string): new (model?: any) => IView {
  var tokenIterator = new TokenIterator(razorMarkup),
      parser = new Parser(tokenIterator),
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile();

  return viewClass;
}

export function transpileFile(razorPath: string): new (model?: any) => IView {
  var source = fs.readFileSync(razorPath, {encoding: 'utf8'});
  var viewClass = transpile(source);
  return viewClass;
}

export interface IViewEngineOptions {
  viewContentsProvider?: (path: string) => string;
}

var defaultViewEngineOptions = {
  viewContentsProvider: path => {
    if (fs.existsSync(path)) {
      return fs.readFileSync(path, {encoding: 'utf8'});
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

  public renderView(viewName: string): string;
  public renderView(viewName: string, model: any): string;
  public renderView(viewName: string, model: any, bodyOfLayout: string): string;
  public renderView(viewName: string, model?: any, bodyOfLayout?: string): string {
    if (this.views[viewName] === undefined) {
      var viewSource = this.options.viewContentsProvider(viewName);
      if (!viewSource) {
        throw new Error('could not find view ' + viewName);
      }
      var viewClass = transpile(viewSource);
      this.views[viewName] = viewClass;
    }

    var renderedView: string;

    var view = new this.views[viewName](model);

    for (var helper in this.helpers) {
      if (this.helpers.hasOwnProperty(helper)) {
        view.helpers[helper] = this.helpers[helper];
      }
    }

    if (bodyOfLayout) {
      (<any>view).renderBody = function() {
        return new HtmlString(bodyOfLayout);
      };
    }

    renderedView = view.execute();

    if (view.layout) {
      var layoutPath = path.join(path.dirname(viewName), view.layout);
      renderedView = this.renderView(layoutPath, view, renderedView);
    }

    return renderedView;
  }
}
