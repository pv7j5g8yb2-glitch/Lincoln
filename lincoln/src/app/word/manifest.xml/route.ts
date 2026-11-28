// The Word add-in's manifest: what Word installs (Insert, Add-ins, Upload My Add-in, or deployed by the firm's
// Microsoft 365 admin). It points Word at the task pane served here and adds a Lincoln button to the Home tab.

const ID = "041a2b03-e65e-405c-a6ad-03ee69b272cb";

export function GET(req: Request) {
  const base = (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  const icon = (n: number) => `${base}/word/icon-${n}.png`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0" xmlns:ov="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="TaskPaneApp">
  <Id>${ID}</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Lincoln</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="Lincoln"/>
  <Description DefaultValue="Insert Lincoln drafts and check a document against the case file and the current INA and CFR."/>
  <IconUrl DefaultValue="${icon(32)}"/>
  <HighResolutionIconUrl DefaultValue="${icon(64)}"/>
  <SupportUrl DefaultValue="${base}/help"/>
  <AppDomains>
    <AppDomain>${base}</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Document"/>
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="${base}/word"/>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
      <Host xsi:type="Document">
        <DesktopFormFactor>
          <GetStarted>
            <Title resid="Lincoln.Title"/>
            <Description resid="Lincoln.Description"/>
            <LearnMoreUrl resid="Lincoln.Help"/>
          </GetStarted>
          <ExtensionPoint xsi:type="PrimaryCommandSurface">
            <OfficeTab id="TabHome">
              <Group id="Lincoln.Group">
                <Label resid="Lincoln.Title"/>
                <Icon>
                  <bt:Image size="16" resid="Lincoln.Icon16"/>
                  <bt:Image size="32" resid="Lincoln.Icon32"/>
                  <bt:Image size="80" resid="Lincoln.Icon80"/>
                </Icon>
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
                    <TaskpaneId>Lincoln.Pane</TaskpaneId>
                    <SourceLocation resid="Lincoln.Pane.Url"/>
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
        <bt:Url id="Lincoln.Pane.Url" DefaultValue="${base}/word"/>
        <bt:Url id="Lincoln.Help" DefaultValue="${base}/help"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="Lincoln.Title" DefaultValue="Lincoln"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="Lincoln.Description" DefaultValue="Insert Lincoln drafts and check a document against the case file and the current INA and CFR."/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": 'attachment; filename="lincoln-word.xml"' } });
}
