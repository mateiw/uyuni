Name: spacewalk-reports
Summary: Script based reporting
Group: Applications/Internet
License: GPLv2
Version: 1.10.5
Release: 1%{?dist}
URL: https://fedorahosted.org/spacewalk
Source0: https://fedorahosted.org/releases/s/p/spacewalk/%{name}-%{version}.tar.gz
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch: noarch
Requires: python
Requires: spacewalk-branding
BuildRequires: /usr/bin/docbook2man

%description
Script based reporting to retrieve data from Spacewalk server in CSV format.

%prep
%setup -q

%build
/usr/bin/docbook2man *.sgml

%install
rm -rf $RPM_BUILD_ROOT
install -d $RPM_BUILD_ROOT/%{_bindir}
install -d $RPM_BUILD_ROOT/%{_prefix}/share/spacewalk
install -d $RPM_BUILD_ROOT/%{_prefix}/share/spacewalk/reports/data
install -d $RPM_BUILD_ROOT/%{_mandir}/man8
install spacewalk-report $RPM_BUILD_ROOT/%{_bindir}
install reports.py $RPM_BUILD_ROOT/%{_prefix}/share/spacewalk
install -m 644 reports/data/* $RPM_BUILD_ROOT/%{_prefix}/share/spacewalk/reports/data
install *.8 $RPM_BUILD_ROOT/%{_mandir}/man8
chmod -x $RPM_BUILD_ROOT/%{_mandir}/man8/spacewalk-report.8*

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
%attr(755,root,root) %{_bindir}/spacewalk-report
%dir %{_datadir}/spacewalk
%{_datadir}/spacewalk/reports.py*
%{_datadir}/spacewalk/reports
%{_mandir}/man8/spacewalk-report.8*
%doc COPYING

%changelog
* Tue May 07 2013 Jan Pazdziora 1.10.5-1
- report patterns should have 644 in git
- deploying /data/* content with 644 instead 755

* Tue Apr 09 2013 Tomas Kasparek <tkasparek@redhat.com> 1.10.4-1
- moving system currency config defaults from separate file to rhn_java.conf

* Wed Mar 20 2013 Tomas Kasparek <tkasparek@redhat.com> 1.10.3-1
- making system-currency work on postgres
- making system-crash-details work on postgres

* Fri Mar 15 2013 Jan Pazdziora 1.10.2-1
- Fixing Oracle-specific nvl and single-parameter to_char.

* Thu Mar 07 2013 Tomas Kasparek <tkasparek@redhat.com> 1.10.1-1
- spacewalk-report: added reports for spacewalk-abrt
- Bumping package versions for 1.9
- Purging %%changelog entries preceding Spacewalk 1.0, in active packages.

* Thu Feb 28 2013 Jan Pazdziora 1.9.6-1
- Removing the dsn parameter from initDB, removing support for --db option.

* Tue Feb 26 2013 Tomas Kasparek <tkasparek@redhat.com> 1.9.5-1
- 914902 - system currency report

* Fri Feb 15 2013 Milan Zazrivec <mzazrivec@redhat.com> 1.9.4-1
- Updating copyright info for 2013

* Mon Jan 28 2013 Tomas Kasparek <tkasparek@redhat.com> 1.9.3-1
- 237581 - OSAD status report

* Tue Jan 22 2013 Tomas Kasparek <tkasparek@redhat.com> 1.9.2-1
- 768074 - report of package upgrades available for systems
  (tkasparek@redhat.com)
- 745342 - system custom info report (tkasparek@redhat.com)

* Thu Jan 17 2013 Tomas Kasparek <tkasparek@redhat.com> 1.9.1-1
- parametrization of spacewalk-report with spacewalk config
- security fix + fixing typo
- 703629 - spacewalk-report inactive-systems RFE
- 662773 - spacewalk-report system-packages-installed
- 745342 - additional column in spacewalk-report inventory
- removing unnecesarry whitespaces
- 477631 - spacewalk-report RFE
- Bumping package versions for 1.9.

* Sat Jun 16 2012 Miroslav Suchý <msuchy@redhat.com> 1.8.4-1
- 827022 - add COPYING file

* Mon May 21 2012 Jan Pazdziora 1.8.3-1
- %%defattr is not needed since rpm 4.4
- require spacewalk-branding
- simplify spec and own directory /usr/share/spacewalk/reports

* Tue Apr 03 2012 Jan Pazdziora 1.8.2-1
- Rework reporting to correspond with 0-n rule/ident mapping
  (slukasik@redhat.com)

* Wed Mar 14 2012 Jan Pazdziora 1.8.1-1
- 803228 - concatenation with null gives null on PostgreSQL, fixing.

* Mon Feb 27 2012 Simon Lukasik <slukasik@redhat.com> 1.7.1-1
- OpenSCAP integration -- Spacewalk reports. (slukasik@redhat.com)
- Bumping package versions for 1.7. (mzazrivec@redhat.com)

* Tue Nov 29 2011 Miroslav Suchý 1.6.3-1
- IPv6: reporting - make inventory report IPv6 aware
- IPv6: reporting - make errata-systems report IPv6 aware

* Thu Aug 11 2011 Miroslav Suchý 1.6.2-1
- do not mask original error by raise in execption

* Mon Aug 08 2011 Jan Pazdziora 1.6.1-1
- Add the --where-<column-id> option to help and man page.
- New reports: errata-channels and kickstartable-trees.

* Tue Jul 19 2011 Jan Pazdziora 1.5.4-1
- Updating the copyright years.

* Fri Jun 24 2011 Jan Pazdziora 1.5.3-1
- Add support for the --where-column-id=value parameter.

* Wed Jun 01 2011 Jan Pazdziora 1.5.2-1
- Fixing the SGML source of the spacewalk-report man page.

* Thu Apr 14 2011 Jan Pazdziora 1.5.1-1
- The initCFG is no longer imported directly to spacewalk.common.

* Tue Mar 22 2011 Jan Pazdziora 1.4.5-1
- There is no cursor() function for inline cursors in PostgreSQL, using custom
  function get_hw_info_as_clob instead.
- Rewriting outer joins to ANSI syntax.

* Thu Mar 10 2011 Jan Pazdziora 1.4.4-1
- 683525 - adding flex_used and flex_total to the entitlements report.

* Tue Mar 08 2011 Jan Pazdziora 1.4.3-1
- Reporting: adding six system-history subreports.

* Mon Mar 07 2011 Jan Pazdziora 1.4.2-1
- For Initiate a kickstart action, show the label of the kickstart profile in
  the report.

* Mon Feb 21 2011 Jan Pazdziora 1.4.1-1
- Reporting: system-history proof of concept report.

* Thu Nov 25 2010 Michael Mraka <michael.mraka@redhat.com> 1.3.1-1
- fixed namespace of imported modules

* Mon Sep 20 2010 Jan Pazdziora 1.2.3-1
- 634961 - stop null/None values from being presented as "None".

* Wed Aug 18 2010 Jan Pazdziora 1.2.2-1
- 623941, 578292 - add report channel-packages which provides full list
  of packages in channels.
- 623941, 578292 - update the report column names to be more descriptive.

* Fri Aug 13 2010 Jan Pazdziora 1.2.1-1
- Sort the list of reports to make it easier to read it.
- 623941 - add the channels report which lists channel and number of packages
  in each channel.
- 623941 - add the errata-list-all report which lists all reports in the
  Spacewalk, not just those that affect some systems.
- bumping package versions for 1.2 (mzazrivec@redhat.com)

* Mon Aug 09 2010 Milan Zazrivec <mzazrivec@redhat.com> 1.1.2-1
- 601984 - use clob for the concatting operation, to overcome the varchar
  length limit. (jpazdziora@redhat.com)

* Fri Jul 16 2010 Milan Zazrivec <mzazrivec@redhat.com> 1.1.1-1
- bumping spec files to future 1.1 packages

