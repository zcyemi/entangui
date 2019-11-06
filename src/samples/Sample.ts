import { UIContainer } from "../UIContainer";
import { UIRenderer, UISourceLocal, ServiceBind } from "../UIService";


enum SampleGroup {
    Input,
    Buttons,
}

export class SampleUI extends UIContainer {

    private m_groupId: string;
    private m_groupMap: string[] = [];
    public constructor() {
        super();

        for (const key in SampleGroup) {
            if (SampleGroup.hasOwnProperty(key)) {
                const element = SampleGroup[key];
                if ((typeof element == 'number')) {
                    this.m_groupMap.push(key);
                }
            }
        }
    }

    protected OnGUI() {

        this.flexBegin();

        this.FlexItemBegin('250px');
        this.drawNavBar();
        this.flexItemEnd();

        this.FlexItemBegin();

        this.drawContent();
        this.flexItemEnd();

        this.flexEnd();

    }

    private drawNavBar() {
        this.sidebarBegin('menubar', 'EntanGUI Samples', (item) => { this.m_groupId = item });

        this.m_groupMap.forEach(item => {
            this.sidebarItem(item, item);
        })
        this.sidebarEnd();
    }

    private drawContent() {
        if (!this.m_groupId) return;

        let funcName = `sample${this.m_groupId}`;
        let func: Function = this[funcName];
        if (!func) return;
        func.call(this);
    }


    private m_inputA:string;
    private m_inputB:string;

    private sampleInput() {
        this.input('InputA', this.m_inputA,(val)=>{
            this.m_inputA =val;
        });
        this.input('InputB', this.m_inputB,(val)=>{
            this.m_inputB = val;
        });
    }

    private sampleButtons() {

    }
}

var render = new UIRenderer(document.getElementById('container'));

var source = new UISourceLocal(new SampleUI());
ServiceBind(source, render);