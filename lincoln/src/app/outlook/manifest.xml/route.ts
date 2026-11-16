// The Outlook add-in's manifest: what Outlook installs (Get Add-ins, My add-ins, Add a custom add-in, or deployed by
// the firm's Microsoft 365 admin). It adds a Lincoln button to every email that opens the pane served here.

const ID = "7c3f1d52-9a4e-4b8e-a0d2-5f61c2b8e914";

export function GET(req: Request) {
  const base = (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  const icon = (n: number) => `${base}/word/icon-${n}.png`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0" xmlns:mailappor="http://schemas.microsoft.com/office/mailappversionoverrides/1.0" xsi:type="MailApp">
  <Id>${ID}</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Lincoln</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="Lincoln"/>
  <Description DefaultValue="The case behind each email, what Lincoln has done, and the reply ready for approval."/>
  <IconUrl DefaultValue="${icon(64)}"/>
  <HighResolutionIconUrl DefaultValue="${icon(80)}"/>
  <SupportUrl DefaultValue="${base}/help"/>
  <AppDomains>
    <AppDomain>${base}</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Mailbox"/>
  </Hosts>
  <Requirements>
    <Sets>
      <Set Name="Mailbox" MinVersion="1.5"/>
    </Sets>
  </Requirements>
  <FormSettings>
    <Form xsi:type="ItemRead">
      <DesktopSettings>
        <SourceLocation DefaultValue="${base}/outlook"/>
        <RequestedHeight>450</RequestedHeight>
      </DesktopSettings>
    </Form>
  </FormSettings>
  <Permissions>ReadItem</Permissions>
  <Rule xsi:type="RuleCollection" Mode="Or">
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Read"/>
  </Rule>
  <DisableEntityHighlighting>false</DisableEntityHighlighting>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/mailappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Requirements>
      <bt:Sets DefaultMinVersion="1.5">
        <bt:Set Name="Mailbox"/>
      </bt:Sets>
    </Requirements>
    <Hosts>
      <Host xsi:type="MailHost">
        <DesktopFormFactor>
          <ExtensionPoint xsi:type="MessageReadCommandSurface">
            <OfficeTab id="TabDefault">
              <Group id="Lincoln.Group">
                <Label resid="Lincoln.Title"/>
                <Control xsi:type="Button" id="Lincoln.Open">
                  <Label resid="Lincoln.Title"/>
                  <Supertip>
                    <Title resid="Lincoln.Title"/>
                    <Description resid="Lincoln.Description"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="Lincoln.Icon16"/>
                    <bt:Image size="32" resid="Lincoln.Icon32"/>
                    <bt:Image size="80" resid="Lincoln.Icon80"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <SourceLocation resid="Lincoln.Pane.Url"/>
                    <SupportsPinning>true</SupportsPinning>
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
    </Hosts>
    <Resources>
      <bt:Images>
        <bt:Image id="Lincoln.Icon16" DefaultValue="${icon(16)}"/>
        <bt:Image id="Lincoln.Icon32" DefaultValue="${icon(32)}"/>
        <bt:Image id="Lincoln.Icon80" DefaultValue="${icon(80)}"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="Lincoln.Pane.Url" DefaultValue="${base}/outlook"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="Lincoln.Title" DefaultValue="Lincoln"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="Lincoln.Description" DefaultValue="The case behind this email, what Lincoln has done, and the reply ready for approval."/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": 'attachment; filename="lincoln-outlook.xml"' } });
}
