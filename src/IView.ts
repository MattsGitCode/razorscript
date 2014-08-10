interface IView {
  model: any;
  execute(): string;
  layout: string;
}

export = IView;
