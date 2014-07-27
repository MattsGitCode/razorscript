interface IView {
  execute(): string;
  execute(model?: any): string;
}

export = IView;
