const ChatLayout = ({
  sidebar,
  header,
  children,
  footer,
  showSidebarOnMobile = true,
  showChatOnMobile = true,
}) => (
  <div className="mx-auto flex h-screen max-w-5xl overflow-hidden bg-slate-50 shadow-2xl dark:bg-slate-900 sm:my-0 sm:h-screen">
    <div className={`${showSidebarOnMobile ? 'flex' : 'hidden'} w-full sm:flex sm:w-auto`}>
      {sidebar}
    </div>
    <div
      className={`min-w-0 flex-1 flex-col ${showChatOnMobile ? 'flex' : 'hidden'} sm:flex`}
    >
      <div className="relative z-40">{header}</div>
      <main className="flex-1 overflow-hidden">{children}</main>
      {footer}
    </div>
  </div>
);

export default ChatLayout;
