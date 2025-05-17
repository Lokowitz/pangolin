"use client";

import { CheckboxWithLabel } from "@app/components/ui/checkbox";
import {
    InfoSection,
    InfoSectionContent,
    InfoSections,
    InfoSectionTitle
} from "@app/components/InfoSection";

type PermissionsSelectBoxProps = {
    root?: boolean;
    selectedPermissions: Record<string, boolean>;
    onChange: (updated: Record<string, boolean>) => void;
};

function getActionsCategories(root: boolean) {
    const actionsByCategory: Record<string, Record<string, string>> = {
        Organization: {
            "Get Organization": "getOrg",
            "Update Organization": "updateOrg",
            "Get Organization User": "getOrgUser",
            "List Organization Domains": "listOrgDomains",
        },

        Site: {
            "Create Site": "createSite",
            "Delete Site": "deleteSite",
            "Get Site": "getSite",
            "List Sites": "listSites",
            "Update Site": "updateSite",
            "List Allowed Site Roles": "listSiteRoles"
        },

        Resource: {
            "Create Resource": "createResource",
            "Delete Resource": "deleteResource",
            "Get Resource": "getResource",
            "List Resources": "listResources",
            "Update Resource": "updateResource",
            "List Resource Users": "listResourceUsers",
            "Set Resource Users": "setResourceUsers",
            "Set Allowed Resource Roles": "setResourceRoles",
            "List Allowed Resource Roles": "listResourceRoles",
            "Set Resource Password": "setResourcePassword",
            "Set Resource Pincode": "setResourcePincode",
            "Set Resource Email Whitelist": "setResourceWhitelist",
            "Get Resource Email Whitelist": "getResourceWhitelist"
        },

        Target: {
            "Create Target": "createTarget",
            "Delete Target": "deleteTarget",
            "Get Target": "getTarget",
            "List Targets": "listTargets",
            "Update Target": "updateTarget"
        },

        Role: {
            "Create Role": "createRole",
            "Delete Role": "deleteRole",
            "Get Role": "getRole",
            "List Roles": "listRoles",
            "Update Role": "updateRole",
            "List Allowed Role Resources": "listRoleResources"
        },

        User: {
            "Invite User": "inviteUser",
            "Remove User": "removeUser",
            "List Users": "listUsers",
            "Add User Role": "addUserRole"
        },

        "Access Token": {
            "Generate Access Token": "generateAccessToken",
            "Delete Access Token": "deleteAcessToken",
            "List Access Tokens": "listAccessTokens"
        },

        "Resource Rule": {
            "Create Resource Rule": "createResourceRule",
            "Delete Resource Rule": "deleteResourceRule",
            "List Resource Rules": "listResourceRules",
            "Update Resource Rule": "updateResourceRule"
        }
    };

    if (root) {
        actionsByCategory["Organization"] = {
            "List Organizations": "listOrgs",
            "Check ID": "checkOrgId",
            "Create Organization": "createOrg",
            "Delete Organization": "deleteOrg",
            "List API Keys": "listApiKeys",
            "List API Key Actions": "listApiKeyActions",
            "Set API Key Allowed Actions": "setApiKeyActions",
            "Create API Key": "createApiKey",
            "Delete API Key": "deleteApiKey",
            ...actionsByCategory["Organization"]
        };

        actionsByCategory["Identity Provider (IDP)"] = {
            "Create IDP": "createIdp",
            "Update IDP": "updateIdp",
            "Delete IDP": "deleteIdp",
            "List IDP": "listIdps",
            "Get IDP": "getIdp",
            "Create IDP Org Policy": "createIdpOrg",
            "Delete IDP Org Policy": "deleteIdpOrg",
            "List IDP Orgs": "listIdpOrgs",
            "Update IDP Org": "updateIdpOrg"
        };
    }

    return actionsByCategory;
}

export default function PermissionsSelectBox({
    root,
    selectedPermissions,
    onChange
}: PermissionsSelectBoxProps) {
    const actionsByCategory = getActionsCategories(root ?? false);

    const togglePermission = (key: string, checked: boolean) => {
        onChange({
            ...selectedPermissions,
            [key]: checked
        });
    };

    const areAllCheckedInCategory = (actions: Record<string, string>) => {
        return Object.values(actions).every(
            (action) => selectedPermissions[action]
        );
    };

    const toggleAllInCategory = (
        actions: Record<string, string>,
        value: boolean
    ) => {
        const updated = { ...selectedPermissions };
        Object.values(actions).forEach((action) => {
            updated[action] = value;
        });
        onChange(updated);
    };

    const allActions = Object.values(actionsByCategory).flatMap(Object.values);
    const allPermissionsChecked = allActions.every(
        (action) => selectedPermissions[action]
    );

    const toggleAllPermissions = (checked: boolean) => {
        const updated: Record<string, boolean> = {};
        allActions.forEach((action) => {
            updated[action] = checked;
        });
        onChange(updated);
    };

    return (
        <>
            <div className="mb-4">
                <CheckboxWithLabel
                    variant="outlinePrimarySquare"
                    id="toggle-all-permissions"
                    label="Allow All Permissions"
                    checked={allPermissionsChecked}
                    onCheckedChange={(checked) =>
                        toggleAllPermissions(checked as boolean)
                    }
                />
            </div>
            <InfoSections cols={5}>
                {Object.entries(actionsByCategory).map(
                    ([category, actions]) => {
                        const allChecked = areAllCheckedInCategory(actions);
                        return (
                            <InfoSection key={category}>
                                <InfoSectionTitle>{category}</InfoSectionTitle>
                                <InfoSectionContent>
                                    <div className="space-y-2">
                                        <CheckboxWithLabel
                                            variant="outlinePrimarySquare"
                                            id={`toggle-all-${category}`}
                                            label="Allow All"
                                            checked={allChecked}
                                            onCheckedChange={(checked) =>
                                                toggleAllInCategory(
                                                    actions,
                                                    checked as boolean
                                                )
                                            }
                                        />
                                        {Object.entries(actions).map(
                                            ([label, value]) => (
                                                <CheckboxWithLabel
                                                    variant="outlineSquare"
                                                    key={value}
                                                    id={value}
                                                    label={label}
                                                    checked={
                                                        !!selectedPermissions[
                                                            value
                                                        ]
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        togglePermission(
                                                            value,
                                                            checked as boolean
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </InfoSectionContent>
                            </InfoSection>
                        );
                    }
                )}
            </InfoSections>
        </>
    );
}
