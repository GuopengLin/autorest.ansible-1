

import {Module} from "./Module";
import {ModuleTest} from "./ModuleTest";
import * as yaml from "node-yaml";
import {serialize} from "@azure-tools/codegen";

export class AnsibleCodeModel {
    private model: any = null;
    public Modules: Module[] = [];
    public Tests: ModuleTest[] = [];
    private log: Function;
    public DebugInfo:any = {};
    constructor(model: any, chooseModule: string, listMode:boolean, log: Function) {
        this.model = model;
        this.log = log;
        if (listMode)
            this.ListModule();
        else
            this.Init(chooseModule);
    }

    private ListModule(){
        for (let module of this.model.operationGroups) {
            this.log(module["$key"]);
        }
    }
    private Init(chooseModule: string){
        for (let module of this.model.operationGroups){
            if (chooseModule != null && module["$key"] != chooseModule )
                continue;
            let mainModule = new Module(module, false);
            let infoModule = new Module(module, true);

            mainModule.MgmtClientName ="GenericRestClient";
            mainModule.PythonMgmtClient = this.model.info.pascal_case_title;

            let idx = this.model.info.title.indexOf("ManagementClient") != -1? this.model.info.title.indexOf("ManagementClient") :this.model.info.title.indexOf("Client");

            mainModule.PythonNamespace = "azure.mgmt."+ this.model.info.title.substring(0,idx).toLowerCase();
            infoModule.MgmtClientName = "GenericRestClient";
            infoModule.PythonMgmtClient =  this.model.info.pascal_case_title;
            infoModule.PythonNamespace = "azure.mgmt."+ this.model.info.title.substring(0,idx).toLowerCase();
            this.Modules.push(mainModule);
            this.Modules.push(infoModule);

            let test = new ModuleTest(mainModule.ModuleName, mainModule.ModuleMethods, mainModule.ObjectName);
            this.Tests.push(test);
            if (chooseModule != null){
                let doc :any = {};
                doc['api-spec'] = serialize(module);
                doc['main-module'] = serialize(mainModule);
                doc['info-module'] = serialize(infoModule);
                doc['test'] = serialize(test);
                this.DebugInfo[module["$key"]+"_raw_model.yaml"] = yaml.dump(module);
                this.DebugInfo[module["$key"]+"_main_model.yaml"] = yaml.dump(mainModule);
                this.DebugInfo[module["$key"]+"_info_model.yaml"] = yaml.dump(infoModule);
            }

        }
    }

}

