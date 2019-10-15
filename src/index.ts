import { UIContext } from "./UIBuilder";

var container = document.getElementById("container");

export class TestUI extends UIContext{

    private showButton:boolean = false;

    public constructor(){
        super();
    }

    DrawUI() {

        this.button("Click me1", () => {
            this.showButton = !this.showButton;
        });

        if (this.showButton) {
            this.button("Click me2");
        }
    }
}

var ctx = new TestUI();
ctx.patch(container);
ctx.update();