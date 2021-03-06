# Introduction

Ansible Code Generator is an autorest extension used to generate azure ansible modules. To understand how it works, you may first go through the main [autorest](https://github.com/Azure/autorest)
doc to get familiar with concepts like Extension, plugin, jsonrpc, codeModel, etc. This code generator's primary purpose is to facilitate the development of new ansible modules.
This means we don't guarantee that the generated ansible module is bug-free and ready to run. Nevertheless, our testing shows that some of the generated modules can
be executed directly.


```
----------------        `    ------------------    ---------------     ---------------    -------------------
| swagger spec | -> .... -> |  modeler four   | ->  |  cli/common | -> | python/namer| -> | ansible-codegen |
----------------             ------------------    ---------------     ---------------    -------------------
```

This code generator composes several autorest extensions via the pipeline mechanisms provided by autorest core, as the above ASCII pic depicted. 
The direct input of ansible-codegen is the codeModel emitted from python/namer. Internally, the received codeModel will be further 
transformed and enriched into a new codeMdole (ansible codeModel). The final step is to use the ansible codeModel rendering a pre-defined "ansible module" template 
to generate the ansible module. Using the terms "template" and "rendering" might be a little misleading here. The current implementation still
prints the generated code line by line to the output file. In essence, the printing-line-by-line way and template-rendering way is the same thing. But using the template-rendering paradigm
to describe how the code generator works will let the audience easily understand.


## 1. Ansible module structure

Most of the python sdk based ansible modules in the [ansible azure collections](https://github.com/ansible-collections/azure/tree/dev/plugins/modules) shares quite similar internal structure. These ansible modules usually:

* begins with a header section
* followed by a documentation section
* followed by an examples section
* followed by a return section
* followed by common import section
* followed by a Actions definition
* followed by the module class definition. 
* ends with a __main__ section

```
#!/usr/bin/python
#
# Copyright (c) 2020 Microsot
#
# GNU General Public License v3.0+ (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)

from __future__ import absolute_import, division, print_function
__metaclass__ = type


ANSIBLE_METADATA = {'metadata_version': '1.1',
                    'status': ['preview'],
                    'supported_by': 'community'}

{
    DOCUMENTATION BLOCK
}


EXAMPLES = '''
{
    EXAMPLES BLOCK
}
'''

RETURN = '''
{
    MODULE RESPONSE BLOCK
}

'''

//common import
from ansible_collections.azure.azcollection.plugins.module_utils.azure_rm_common_ext import AzureRMModuleBaseExt
try:
    from msrestazure.azure_exceptions import CloudError
    from azure.mgmt.attestation import AttestationManagementClient
    from msrestazure.azure_operation import AzureOperationPoller
    from msrest.polling import LROPoller
except ImportError:
    # This is handled in azure_rm_common
    pass


class Actions:
    NoAction, Create, Update, Delete = range(4)


class ModuleName(AzureRMModuleBaseExt):
    def __init__(self):
        {
            { Module Argument Spec Definition }
            { Initialize Module Parameter  }
            { Initialize Base Module }
        }
        
            
    def exec_module(self, **kwargs):
        for key in list(self.module_arg_spec.keys()):
            if hasattr(self, key):
                setattr(self, key, kwargs[key])
            elif kwargs[key] is not None:
                self.body[key] = kwargs[key]

        resource_group = self.get_resource_group(self.resource_group)
        if not self.location:
        # Set default location
            self.location = resource_group.location
        self.body['location'] = self.location
        self.inflate_parameters(self.module_arg_spec, self.body, 0)

        old_response = None
        response = None

        {{ get client }}
        

        old_response = self.get_resource()

        if not old_response:
            if self.state == 'present':
                self.to_do = Actions.Create
        else:
            if self.state == 'absent':
                self.to_do = Actions.Delete
            else:
                modifiers = {}
                self.create_compare_modifiers(self.module_arg_spec, '', modifiers)
                self.results['modifiers'] = modifiers
                self.results['compare'] = []
                if not self.default_compare(modifiers, self.body, old_response, '', self.results):
                    self.to_do = Actions.Update

        if (self.to_do == Actions.Create) or (self.to_do == Actions.Update):
            self.results['changed'] = True
            if self.check_mode:
                return self.results
            response = self.create_update_resource()
        elif self.to_do == Actions.Delete:
            self.results['changed'] = True
            if self.check_mode:
                return self.results
            self.delete_resource()
        else:
            self.results['changed'] = False
            response = old_response
            self.results['state'] = response

        return self.results

    def create_update_resource(self):
        try:
            if self.to_do == Actions.Create:
                {{ call create function in service client }}
                
            else:
                {{ call update function in service client }}
            if isinstance(response, AzureOperationPoller) or isinstance(response, LROPoller):
                response = self.get_poller_result(response)
        except CloudError as exc:
            self.log('Error attempting to create the {{ module }} instance.')
            self.fail('Error creating the AttestationProvider instance: {0}'.format(str(exc)))
        return response.as_dict()

    def delete_resource(self):
        try:
            response = {{ call delete function in service client }}
                                                                    
        except CloudError as e:
           {{ exception handling }}

        return True

    def get_resource(self):
        try:
            response = {{ call get function in service client }}
        except CloudError as e:
            return False
        return response.as_dict()


def main():
    {{ module class name }}()


if __name__ == '__main__':
    main()

```

The strong similarity among these ansible modules justifies the feasibility of writing an ansible codegen. 
And we can use one sentence describe how this codegen works roughly:

  **Transform and enrich the codeModel emitted by autorest python autorest extension into a container class called AnsibleCodeModel, then using the
  information contains in the AnsibleCodeModel composing the varying part of the pre-defined ansible module template.**

To be specific, the composing parts include:

  * composing the module documentation and argument spec
  * composing the service client
  * composing the module return 
  * composing the crud methods in module

## 2. The Ansible CodeModel

See [here](../src/plugins/Common/Module.ts)


## 3. The composing logic

### 3.1 composing the module documentation and arguspec

Arguspec is the ansible term for module parameter schema. And ansible documentation is just an enriched version schema with more description and unique format requirements. The composing logic for module documentation and module arguspec are quite similar. They all use the Module options(parameters) defined in Ansible codeModel as input, recursively transform them into the schemas required by ansible modules.

see [here](../src/plugins/Ansible/AnsibleModuleCommon.ts#L278)

### 3.2 composing the service client

```
output.push("        self.mgmt_client = self.get_mgmt_svc_client(" + module.PythonMgmtClient + ",");
    output.push("                                                    base_url=self._cloud_environment.endpoints.resource_manager,");
    output.push("                                                    api_version='"+module.ModuleApiVersion+"')");
```

See [here](https://github.com/ansible-collections/azure/blob/dev/plugins/module_utils/azure_rm_common.py#L850) for the implementation of **get_mgmt_svc_client**

### 3.3 composing the crud methods

Azure python sdks are generated by autorest.python extension. Python extension uses some conventions to declare and name the CRUD methods and corresponding method parameters.
You may look at the following two function siganaures to get a sense of the conventions used by the autorest.python.

* [create_or_update](https://github.com/Azure/azure-sdk-for-python/blob/master/sdk/network/azure-mgmt-dns/azure/mgmt/dns/v2018_03_01_preview/operations/_record_sets_operations.py#L127) function signaure for dns record sets
* [update](https://github.com/Azure/azure-sdk-for-python/blob/master/sdk/batch/azure-mgmt-batch/azure/mgmt/batch/operations/_batch_account_operations.py#L188) function signaure for batch account

To summary the conventions:
*  methods and method parameter name use snake case.
*  the create function's name is "create".
*  the update function's name is "update".
*  If update is not supported, there will be a function named "create_or_update". 
*  There is an method parameter named "parameter" in create and update function. This parameter represends the http body in the lower level http call.
*  They parameters before "parameter" in the method parameter list are required ones.
  

The following two snippets pretty much self-explains how to composing the "create and update" methods call using the conventions. See [here] (../src/plugins/Ansible/AnsibleModuleSdk.ts) for more details.


```
    if (module.GetMethod('create_or_update') != null || module.GetMethod('create') != null){
        output.push("    def create_update_resource(self):");
        output.push("        try:");
        if (module.HasCreateOrUpdate())
        {
            ModuleGenerateApiCall(output, "            ", module, "create_or_update");
        }
        else
        {
            output.push("            if self.to_do == Actions.Create:");
            ModuleGenerateApiCall(output, "                ", module, "create");
            output.push("            else:");
            ModuleGenerateApiCall(output, "                ", module, "update");
        }
        output.push("            if isinstance(response, AzureOperationPoller) or isinstance(response, LROPoller):");
        output.push("                response = self.get_poller_result(response)");
        output.push("        except CloudError as exc:");
        output.push("            self.log('Error attempting to create the " + module.ObjectName + " instance.')");
        output.push("            self.fail('Error creating the " + module.ObjectName + " instance: {0}'.format(str(exc)))");
        output.push("        return response.as_dict()");
        output.push("");
    }
```


```
export function ModuleGenerateApiCall(output: string[], indent: string, module: Module, methodName: string): string[]
{
    // XXX - ModuleOperationName
    let line: string = indent + "response = self.mgmt_client." + module.ModuleOperationName + "." + ToSnakeCase(methodName) + "(";
    indent = Indent(line);
    let method: ModuleMethod = module.GetMethod(methodName);

    if (method != null)
    {
        for (let option of method.Options)
        {

            if (option.Kind == ModuleOptionKind.MODULE_OPTION_BODY)
                continue;

            // should use python name for lhs method parameters, currently NamePython is not set, using NameSwagger for the moment.
            if (line.endsWith("("))
            {
                let swaggerNsame = option.NameSwagger
                line += option.NameSwagger + "=self." + option.NameAnsible;
            }
            else
            {
                line += ",";
                output.push(line);
                line = indent + option.NameSwagger + "=self." + option.NameAnsible;
            }
        }
        if (method.HasBody){
            line += ",";
            output.push(line);
            line = indent + method.ParameterName + "=self.body";
        }
    }
    line += ")";
    output.push(line);
````

## 4. Future works

Although this code generator can already genearte some working ansible modules without futhuer modification. There're still lots of things we can
do to improve the quality of this codegen and enrich the features it provide to comunity users. Some of the high value work items are listed below.

### using template

Introdcing an template engine let the ansible code generator trully adopt the tempalte-rendering patern in the code genering
phrase. There are several obvious benifits of doing this, including:

    * more clean and concise code. Since python has an strict rule for indenting code, the line-by
    * easy for testing. Since we seperate the "view" from the "model", we can test the "view" and "model" seperately.
    * less error-prone. Since python has a very strict rule for indenting code, using the line-by-line printing way is by naure error-prone.

### track2 python sdk support

There're are two styles of python sdks: track1 and track2 sdk. The two versions of sdks are not campatiable with each other. Track2 sdk is a newer one
and will be the only sdk released in future. Azure ansible modules heavily rely on the underlie auzre python sdks. Currently the python sdks used by azure ansible modules are
all track1 sdks. So currently the ansible python modules suppose that the track1 sdk is used. So we need to support generating track2 sdk as well and add an commandline option
to let the user switch between generating track1 and track2 python sdk compatiable ansible module.


### customization support via directives

Using the current codegen We can generate a working ansible module to manage dns record set. But the generated
python file is named as ```auzre_rm_recordset.py``` rather than ```azure_rm_dnsrecordset.py```, which is required by the naming convention of azure ansible convention.
Incluing the "rp name" as part of the output file name, is not a fixing rule. For example, when generating resources under ```compute```, this rule should not be applied.  
To solve the "per rp conventions" issue, the codegen should support "the per configuration". uaually, as other autorest based codegen already did, it will be done by adding
per codegen directives into the readme.md file under the spec directory. For example, an overrides directive coulde be added like the following to rename ```azure_rm_recordset.py```
to ```azure_rm_dnsrecordset.py```.

``` yaml $(ansible))
overides:
    - where:
        resourceName: RecordSet
    - set:
        ansibleName: DnsRecordSet
```


