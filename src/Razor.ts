/// <reference path="typings/node.d.ts" />
/// <reference path="typings/extend.d.ts" />
import TokenIterator = require('./tokens/TokenIterator');
import Parser = require('./parser/Parser');
import Transpiler = require('./transpiler/Transpiler');
import IView = require('./IView');
import fs = require('fs');
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
  return transpile(source);
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

  constructor(options?: IViewEngineOptions) {
    this.options = extend(null, defaultViewEngineOptions, options);
    this.views = {};
  }

  public renderView(viewName: string, model: any): string;
  public renderView(viewName: string, model: any, bodyOfLayout: string): string;
  public renderView(viewName: string, model: any, bodyOfLayout?: string): string {
    if (this.views[viewName] === undefined) {
      var viewSource = this.options.viewContentsProvider(viewName);
      var viewClass = transpile(viewSource);
      this.views[viewName] = viewClass;
    }

    if (!this.views[viewName]) {
      throw new Error('could not find view ' + viewName);
    }

    var renderedView: string;

    var view = new this.views[viewName](model);

    if (bodyOfLayout) {
      (<any>view).renderBody = function(parentHtml) {
        parentHtml.push(bodyOfLayout);
      };
    }

    renderedView = view.execute();

    if (view.layout) {
      renderedView = this.renderView(view.layout, model, renderedView);
    }

    return renderedView;
  }
}
