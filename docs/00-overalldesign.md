# Introduction
Ansible Code Generator is an autorest extention used to generate azure ansible modules. To understand how it works, you may first go through the main autorest
doc. This doc is mainly for azure ansible community users who are interestd in contributing to the ansible code generator.


## 1. Ansible module structure

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
## 2. The pipeline

```
----------------        `    ------------------    ---------------     ---------------    -------------------
| swagger spec | -> .... -> |  modular four   | ->  |  cli/common | -> | python/namer| -> | ansible-codegen |
----------------             ------------------    ---------------     ---------------    -------------------
```



## 3. Ansible code model

## 4. The composing rules


## 5. Futue works

### using template

### track2 python sdk support

### divide extention to fine-grained plugins