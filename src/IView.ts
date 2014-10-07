interface IView {
  model: any;
  execute(): string;
  layout: string;
  helpers: any;
}

export = IView;
