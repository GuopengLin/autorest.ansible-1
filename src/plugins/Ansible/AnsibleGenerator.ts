import {AnsibleCodeModel} from "../Common/AnsibleCodeModel";

import {GenerateModuleSdk} from "./AnsibleModuleSdk";
import {GenerateModuleSdkInfo} from "./AnsibleModuleSdkInfo";
import {GenerateTest} from "./AnsibleTest";


export  enum ArtifactType {
    ArtifactTypeAnsibleSdk,
    ArtifactTypeAnsibleRest
}


export function GenerateAll(model:AnsibleCodeModel, type:ArtifactType, skipDoc: boolean, track2: boolean) {
    let modules = model.Modules;
    let tests = model.Tests;
    let files = {};
    let path = "";
    for (let module of modules){
        if (module.IsInfoModule){
            // if (type == ArtifactType.ArtifactTypeAnsibleRest){
            //     files[path+module.ModuleName+".py"] = GenerateModuleRestInfo(module, false);
            // }
            if (type == ArtifactType.ArtifactTypeAnsibleSdk){
                files[path+module.ModuleName+".py"] = GenerateModuleSdkInfo(module, skipDoc, track2);
            }
        }else {
            // if (type == ArtifactType.ArtifactTypeAnsibleRest){
            //     files[path+module.ModuleName+".py"] = GenerateModuleRest(module, false);
            // }
            if (type == ArtifactType.ArtifactTypeAnsibleSdk){
                files[path+module.ModuleName+".py"] = GenerateModuleSdk(module, skipDoc, track2);
            }
        }
    }
    for (let test of tests){
        files[path+test.ModuleName+".yml"] = GenerateTest(test);
    }
    return files;
}
