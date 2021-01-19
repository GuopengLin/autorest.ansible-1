# Introduction

Ansible Code Generator is an autorest extention used to generate azure ansible modules. To understand how it works, you may first go through the main autorest
doc to get familir with conectps like Extention, plugin, jsonrpc, codeModel, etc. The main purpose of this code generator is to faciliate the developing of new ansible modules,
Which means we don't guarantee that the generated ansible module is bug free and ready to run. Neverthless, our testing shows that some of the generated modules can
be executed directly.


```
----------------        `    ------------------    ---------------     ---------------    -------------------
| swagger spec | -> .... -> |  modeler four   | ->  |  cli/common | -> | python/namer| -> | ansible-codegen |
----------------             ------------------    ---------------     ---------------    -------------------
```

This code generator compose serveral autorest extentions via the pipline mechanisms provided by autorest core, as the above ascii pic dipicted. 
The direct input of ansible-codegen is the codeModel emitted from python/namer. Internally, the received codeModel from python/namer will be further 
transformed and enriched into a new codeMdole (ansible codeModel). The final step is to use anible codeModel rendering a pre defined "ansible module" template 
to finish the whole code generating process. Using the terms "template" and "rendering" might be a little mis-leading here. The current implementation still
print the generated code line by line to the output file. But it is quite easy to change the current implementation to a template based solution, and the
template-rendering paradigam will be much more clear when describing the way this code generator works. 


## 1. Ansible module structure

Most of the python sdk based ansible modules in the azcollection shares quite similar structure. The majority of the modules consists of:

* a header section
* followed by a documentation section
* followed by an examples section
* followed by a return section
* followed by common import section
* followed by a Actions definition
* followed by the module class definition. And the internal structure of the module classes are also quite similar, I'll not expand and describe
  them all. Instead, the following template-like module file will give you a good sense of the patterns look like. 


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

Ultimatelly speacking, It is this storng similarity among the ansible modules motiveated us start writing this code geneartor.

## 2. Ansible code model



## 3. The composing rules


## 4. Futue works

Although this code generator can already genearte some working ansible modules without futhuer modification. There're still lots of things we can
do to improve the quality of this codegen and enrich the features it provide to comunity users. Some of the high value work items are listed below.

### using template

Introducting an template engine 
### track2 python sdk support

### divide extention to fine-grained plugins

### adding an ansible/namer plugin