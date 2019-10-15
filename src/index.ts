import { UIContext } from "./UIBuilder";

var container = document.getElementById("container");

export class TestUI extends UIContext {

    private showButton: boolean = false;

    public constructor() {
        super();
    }

    DrawUI() {

        this.beginGroup('5px');
        {
            this.button("Click me1", () => {
                this.showButton = !this.showButton;
            });

            if (this.showButton) {
                this.button("Click me2");
            }

            this.alert("Warning nothing error");


            this.beginForm();

            this.formInput("Test Input", 'test input', 'hello world');
            this.formInput("Test Input", 'test input', 'hello world');
            this.formInput("Test Input", 'test input', 'hello world');
            this.formInput("Test Input", 'test input', 'hello world');
            this.endForm();
        }
        this.endGroup();
    }
}

var ctx = new TestUI();
ctx.patch(container);
ctx.update();