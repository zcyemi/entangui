import { UIRenderer } from "./UIClient";
import { UIFrameDataBuilder } from "./UIProtocol";
import { UIContext } from "./UIContext";

var container = document.getElementById("container");

// export class TestUI extends UIContext {

//     private showButton: boolean = false;

//     public constructor() {
//         super();
//     }

//     DrawUI() {

//         this.beginGroup('5px');
//         {
//             this.button("Click me1", () => {
//                 this.showButton = !this.showButton;
//             });

//             if (this.showButton) {
//                 this.button("Click me2");
//             }

//             this.alert("Warning nothing error");


//             this.beginForm();

//             this.formInput("Test Input", 'test input', 'hello world');
//             this.formInput("Test Input", 'test input', 'hello world');
//             this.formInput("Test Input", 'test input', 'hello world');
//             this.formInput("Test Input", 'test input', 'hello world');
//             this.endForm();
//         }
//         this.endGroup();
//     }
// }

// var ctx = new TestUI();
// ctx.patch(container);
// ctx.update();

class TestUI extends UIContext{

    protected onGUI(builder:UIFrameDataBuilder){
        
    }
}

var renderer = new UIRenderer(container);


var builder = new UIFrameDataBuilder();




builder.beginFrame();
builder.beginGroup('5px');
builder.button('Click me1').button('Click me2').alert('test alert')
builder.endGroup();

var data = builder.endFrame();


renderer.onUIFrame(data);