Name: spacewalk-proxy-docs
Summary: Spacewalk Proxy Server Documentation
Group: Applications/Internet
License: Open Publication
URL:     https://fedorahosted.org/spacewalk
Source0: https://fedorahosted.org/releases/s/p/spacewalk/%{name}-%{version}.tar.gz
Version: 1.7.0.4
Release: 1%{?dist}
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch: noarch
BuildRequires: susemanager-client-config_en-pdf
BuildRequires: susemanager-proxy-quick_en-pdf
BuildRequires: susemanager-reference_en-pdf
BuildRequires: xerces-j2
Obsoletes: rhns-proxy-docs < 5.3.0
Provides: rhns-proxy-docs = 5.3.0

%description
This package includes the installation/configuration guide,
and whitepaper in support of an Spacewalk Proxy Server. Also included
are the Client Configuration, Channel Management,
and Enterprise User Reference guides.

%prep
%setup -q

%build
#nothing to do here

%install
rm -rf $RPM_BUILD_ROOT
install -m 755 -d $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/%_defaultdocdir/%{name}
if [ -e %{_datadir}/doc/manual/susemanager-client-config_en-pdf/susemanager-client-config_en.pdf ]; then
cp %{_datadir}/doc/manual/susemanager-client-config_en-pdf/susemanager-client-config_en.pdf $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/
else
cp susemanager-client-config_en.pdf $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/
fi
if [ -e %{_datadir}/doc/manual/susemanager-proxy-quick_en-pdf/susemanager-proxy-quick_en.pdf ]; then
cp %{_datadir}/doc/manual/susemanager-proxy-quick_en-pdf/susemanager-proxy-quick_en.pdf $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/
else
cp susemanager-proxy-quick_en.pdf $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/
fi
if [ -e %{_datadir}/doc/manual/susemanager-reference_en-pdf/susemanager-reference_en.pdf ]; then
cp %{_datadir}/doc/manual/susemanager-reference_en-pdf/susemanager-reference_en.pdf $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/
else
cp susemanager-reference_en.pdf $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/
fi

install -m 644 LICENSE $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/
install -m 644 squid.conf.sample $RPM_BUILD_ROOT/%_defaultdocdir/%{name}/

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
%docdir %_defaultdocdir/%{name}
%dir %_defaultdocdir/%{name}
%_defaultdocdir/%{name}/*

# $Id: proxy.spec,v 1.290 2007/08/08 07:03:05 msuchy Exp $
%changelog
* Mon Apr 19 2010 Michael Mraka <michael.mraka@redhat.com> 1.1.1-1
- bumping spec files to 1.1 packages

* Fri Jan 15 2010 Michael Mraka <michael.mraka@redhat.com> 0.8.1-1
- rebuild for spacewalk 0.8

* Wed May 20 2009 Miroslav Suchy <msuchy@redhat.com> 0.6.2-1
- clarify the license. It is Open Publication instead of GPLv2

* Thu May 14 2009 Miroslav Suchy <msuchy@redhat.com> 0.6.1-1
- 497892 - create access.log on rhel5
- point source0 to fedorahosted.org
- provide versioned Provides: to Obsolete:
- make rpmlint happy
- change buildroot to recommended value
- marking documentation files as %%doc

* Tue Dec  9 2008 Michael Mraka <michael.mraka@redhat.com> 0.4.1-1
- fixed Obsoletes: rhns-* < 5.3.0

* Thu Aug  7 2008 Miroslav Suchy <msuchy@redhat.com> 0.1-2
- Rename to spacewalk-proxy-docs
- clean up spec

* Thu Apr 10 2008 Miroslav Suchy <msuchy@redhat.com>
- Isolate from rhns-proxy

