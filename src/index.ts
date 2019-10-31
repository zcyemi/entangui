import { UIRenderer } from "./UIRenderer";
import { UIContext } from "./UIProtocol";
import { UIContainer } from "./UIContainer";

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

class TestUI extends UIContainer{


    private m_showbtn2:boolean = false;

    protected onGUI(builder:UIContext){

        var self = this;
        builder.beginGroup('5px');
        {
            builder.button("btn1",'clickme1',()=>{
                self.m_showbtn2 = !self.m_showbtn2;
            });

            if(self.m_showbtn2){
                builder.button("btn2",'clickme2');
            }
            builder.alert("test alert");
        }
        builder.endFrame();
    }

}

var testui = new TestUI();


var renderer = new UIRenderer(container);
renderer.MessageEventCallback = (evt)=>{
    testui.context.dispatchEvent(evt);
    renderer.onUIFrame(testui.update());
}


renderer.onUIFrame(testui.update());