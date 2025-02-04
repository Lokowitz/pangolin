import {
    Body,
    Head,
    Html,
    Preview,
    Tailwind
} from "@react-email/components";
import * as React from "react";
import {
    EmailContainer,
    EmailLetterHead,
    EmailHeading,
    EmailText,
    EmailFooter,
    EmailSection,
    EmailGreeting,
    EmailSignature
} from "./components/Email";
import { themeColors } from "./lib/theme";
import CopyCodeBox from "./components/CopyCodeBox";

interface ResourceOTPCodeProps {
    email?: string;
    resourceName: string;
    orgName: string;
    otp: string;
}

export const ResourceOTPCode = ({
    email,
    resourceName,
    orgName: organizationName,
    otp
}: ResourceOTPCodeProps) => {
    const previewText = `Your one-time password for ${resourceName} is ${otp}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind config={themeColors}>
                <Body className="font-sans">
                    <EmailContainer>
                        <EmailLetterHead />

                        <EmailHeading>
                            Your One-Time Code for {resourceName}
                        </EmailHeading>

                        <EmailGreeting>Hi {email || "there"},</EmailGreeting>

                        <EmailText>
                            You’ve requested a one-time password to access{" "}
                            <strong>{resourceName}</strong> in{" "}
                            <strong>{organizationName}</strong>. Use the code
                            below to complete your authentication:
                        </EmailText>

                        <EmailSection>
                            <CopyCodeBox text={otp} />
                        </EmailSection>

                        <EmailFooter>
                            <EmailSignature />
                        </EmailFooter>
                    </EmailContainer>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ResourceOTPCode;
