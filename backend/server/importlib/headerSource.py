#
# Copyright (c) 2008--2010 Red Hat, Inc.
#
# This software is licensed to you under the GNU General Public License,
# version 2 (GPLv2). There is NO WARRANTY for this software, express or
# implied, including the implied warranties of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
# along with this software; if not, see
# http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
# 
# Red Hat trademarks are not licensed under GPLv2. No permission is
# granted to use or replicate Red Hat trademarks that are incorporated
# in this software or its documentation. 
#
#
# Converts headers to the intermediate format
#

import os
import time
import string
from importLib import File, Dependency, ChangeLog, Channel, \
    IncompletePackage, Package, SourcePackage
from backendLib import gmtime, localtime
from types import ListType, TupleType, IntType, LongType, StringType
from spacewalk.common import log_debug
from spacewalk.common.checksum import getFileChecksum, guess_checksum_type

class rpmPackage(IncompletePackage):
    # Various mappings
    tagMap = {
        # Ignoring these tags
        'last_modified'     : None,
        # We set them differently
	'checksum'          : None,
	'checksum_type'     : None,
	'checksum_list'     : None,
        'sigchecksum'       : None,
        'sigchecksum_type'  : None,
    }

    def populate(self, header, size, checksum_type, checksum, path=None, org_id=None,
        header_start=None, header_end=None, channels=[]):
        
        # XXX is seems to me that this is the place that 'source_rpm' is getting
        # set
        for f in self.keys():
            field = f
            if self.tagMap.has_key(f):
                field = self.tagMap[f]
                if not field:
                    # Unsupported
                    continue

            # get the db field value from the header
            val = header[field]
            if f == 'build_time':
                if type(val) in (IntType, LongType):
                    # A UNIX timestamp
                    val = gmtime(val)
            elif val:
                # Convert to strings
                if isinstance(val, unicode):
                    val = unicode.encode(val, 'utf-8')
                else:
                    val = str(val)
            elif val == []:
                val = None
            self[f] = val

        self['package_size'] = size
        self['checksum_type'] = checksum_type
        self['checksum'] = checksum
        self['checksums'] = {checksum_type:checksum}
        self['path'] = path
        self['org_id'] = org_id
        self['header_start'] = header_start
        self['header_end'] = header_end
        self['last_modified'] = localtime(time.time())
        if 'sigmd5' in self:
           if self['sigmd5']:
               self['sigchecksum_type'] = 'md5'
               self['sigchecksum'] = self['sigmd5']
           del(self['sigmd5'])

        # Fix some of the information up
        vendor = self['vendor']
        if vendor is None:
            self['vendor'] = 'Red Hat, Inc.'
        payloadFormat = self['payload_format']
        if payloadFormat is None:
            self['payload_format'] = 'cpio'
        if self['payload_size'] is None:
            self['payload_size'] = 0
        return self

    def _populateFromFile(self, f_path, relpath=None, org_id=None, channels=[],
            source=None):
	f_obj = file(f_path)
        import server.rhnPackageUpload as rhnPackageUpload
        header, payload_stream, header_start, header_end = \
            rhnPackageUpload.load_package(f_obj)
        if (source and not header.is_source) or (not source and header.is_source):
            raise ValueError("Unexpected RPM package type")
                    
        # Get the size
        size = os.path.getsize(f_path)
        path = None
        if relpath:
            # Strip trailing slashes
            path = "%s/%s" % (sanitizePath(relpath), os.path.basename(f_path))
        checksum_type = header.checksum_type()
        checksum = getFileChecksum(header.checksum_type(), file=payload_stream)
        self.populate(header, size, checksum_type, checksum, path, org_id,
                 header_start, header_end, channels)

class rpmBinaryPackage(Package, rpmPackage):
    # Various mappings
    tagMap = rpmPackage.tagMap.copy()
    tagMap.update({
        'package_group' : 'group',
        'rpm_version'   : 'rpmversion',
        'payload_size'  : 'archivesize',
        'payload_format': 'payloadformat',
        'build_host'    : 'buildhost',
        'build_time'    : 'buildtime',
        'source_rpm'    : 'sourcerpm',
        # Arrays: require a different mapping
        'requires'      : None,
        'provides'      : None,
        'conflicts'     : None,
        'obsoletes'     : None,
        'suggests'      : None,
        'supplements'   : None,
        'recommends'    : None,
        'files'         : None,
        'changelog'     : None,
        'channels'      : None,
        # We set them differently
        'package_size'  : None,
        'org_id'        : None,
        'md5sum'        : None,
        'path'          : None,
        'header_start'  : None,
        'header_end'    : None,
        # Unsupported
        'sigpgp'        : None,
        'siggpg'        : None,
        'package_id'    : None,
    })

    def populate(self, header, size, checksum_type, checksum, path=None, org_id=None,
             header_start=None, header_end=None, channels=[]):

        rpmPackage.populate(self, header, size, checksum_type, checksum, path, org_id,
            header_start, header_end)
        
        # Populate file information
        self._populateFiles(header)
        # Populate dependency information
        self._populateDependencyInformation(header)
        # Populate changelogs
        self._populateChangeLog(header)
        # Channels
        self._populateChannels(channels)

    def populateFromFile(self, file, relpath=None, org_id=None, channels=[]):
        return self._populateFromFile(file, relpath, org_id, channels)

    def _populateFiles(self, header):
        self._populateTag(header, 'files', rpmFile)

    def _populateDependencyInformation(self, header):
        mapping = {
            'provides'  : rpmProvides,
            'requires'  : rpmRequires,
            'conflicts' : rpmConflicts,
            'obsoletes' : rpmObsoletes,
            'supplements' : rpmSupplements,
            'suggests'  : rpmSuggests,
            'recommends'  : rpmRecommends,
        }
        for k, v in mapping.items():
            self._populateTag(header, k, v)

    def _populateChangeLog(self, header):
        self._populateTag(header, 'changelog', rpmChangeLog)

    def _populateChannels(self, channels):
        l = []
        for channel in channels:
            dict = {'label' : channel}
            obj = Channel()
            obj.populate(dict)
            l.append(obj)
        self['channels'] = l

    def _populateTag(self, header, tag, Class):
        """
        Populates a tag with a list of Class instances, getting the
        information from a header
        """
        # First fix rpm's brokenness - sometimes singe-elements lists are
        # actually single elements
        fix = {}
        itemcount = 0

        for f, rf in Class.tagMap.items():
            v = sanitizeList(header[rf])
            ic = len(v)
            if not itemcount or ic < itemcount:
                itemcount = ic
            fix[f] = v

        # Now create the array of objects
        self[tag] = []
        unique_deps = []
        for i in range(itemcount):
            hash = {}
            for k, v in fix.items():
                # bugzilla 426963: fix for rpm v3 obsoletes header with
                # empty version and flags values
                if not len(v) and k == 'version':
                    hash[k] = ''
                elif not len(v) and k == 'flags':
                    hash[k] = 0
                else:
                    hash[k] = v[i]
            
            # RPMSENSE_STRONG(1<<27) indicate recommends; if not set it is suggests only
            if tag == 'recommends' and not(hash['flags'] & (1 << 27)):
                continue
            if tag == 'suggests' and (hash['flags'] & (1 << 27)):
                continue
            # Create a file
            obj = Class()
            # Fedora 10+ rpms have duplicate provides deps,
            # Lets clean em up before db inserts.
            if tag in ['requires', 'provides', 'obsoletes', 'conflicts', 'recommends', 'suggests', 'supplements']:
                if not len(hash['name']):
                    continue
                dep_nv = (hash['name'], hash['version'], hash['flags'])

                if dep_nv not in unique_deps:
                    unique_deps.append(dep_nv)
                    obj.populate(hash)
                    self[tag].append(obj)
                else:
                    # duplicate dep, ignore
                    continue
            else:
                if tag == 'files':
                    hash['checksum_type'] = guess_checksum_type(hash['filedigest'])
                obj.populate(hash)
                self[tag].append(obj)


class rpmSourcePackage(SourcePackage, rpmPackage):
    tagMap = rpmPackage.tagMap.copy()
    tagMap.update({
        'package_group' : 'group',
        'rpm_version'   : 'rpmversion',
        'payload_size'  : 'archivesize',
        'build_host'    : 'buildhost',
        'build_time'    : 'buildtime',
        'source_rpm'    : 'sourcerpm',
        # Arrays: require a different mapping
        # We set them differently
        'package_size'  : None,
        'org_id'        : None,
        'md5sum'        : None,
        'path'          : None,
        # Unsupported
        'payload_format': None,
        'channels'      : None,
        'package_id'    : None,
    })
    def populate(self, header, size, checksum_type, checksum, path=None, org_id=None,
        header_start=None, header_end=None, channels=[]):
        rpmPackage.populate(self, header, size, checksum_type, checksum, path, org_id,
            header_start, header_end)
        nvr = []
        # Fill in source_rpm
        for tag in ['name', 'version', 'release']:
            nvr.append(header[tag])
        
        #5/13/05 wregglej - 154248 If 1051 is in the list of keys in the header, the package is a nosrc package and needs to be saved as such.
        if 1051 in header.keys():
            self['source_rpm'] = "%s-%s-%s.nosrc.rpm" % tuple(nvr)
        else:
            self['source_rpm'] = "%s-%s-%s.src.rpm" % tuple(nvr)

        # Convert sigchecksum to ASCII
        self['sigchecksum_type'] = 'md5'
        self['sigchecksum'] = string.join(
            map(lambda x: "%02x" % ord(x), self['sigchecksum']), '')

    def populateFromFile(self, file, relpath=None, org_id=None, channels=[]):
        return self._populateFromFile(file, relpath, org_id, channels, source=1)

class rpmFile(File, ChangeLog):
    # Mapping from the attribute's names to rpm tags
    tagMap = {
        'name'      : 'filenames',
        'device'    : 'filedevices',
        'inode'     : 'fileinodes',
        'file_mode' : 'filemodes',
        'username'  : 'fileusername',
        'groupname' : 'filegroupname',
        'rdev'      : 'filerdevs',
        'file_size' : 'filesizes',
        'mtime'     : 'filemtimes',
        'filedigest'  : 'filemd5s',     # FILEMD5S is a pre-rpm4.6 name for FILEDIGESTS
                                        # we have to use it for compatibility reason
        'linkto'    : 'filelinktos',
        'flags'     : 'fileflags',
        'verifyflags' : 'fileverifyflags',
        'lang'      : 'filelangs',
    }
    def populate(self, hash):
        ChangeLog.populate(self, hash)
        # Fix the time
        tm = self['mtime']
        if type(tm) in (IntType, LongType):
            # A UNIX timestamp
            self['mtime'] = gmtime(tm)
        if type(self['filedigest']) == StringType:
            self['checksum'] = self['filedigest']
            del(self['filedigest'])
    
class rpmProvides(Dependency):
    # More mappings
    tagMap = {
        'name'      : 'provides',
        'version'   : 'provideversion',
        'flags'     : 'provideflags',
    }
    
class rpmRequires(Dependency):
    # More mappings
    tagMap = {
        'name'      : 'requirename',
        'version'   : 'requireversion',
        'flags'     : 'requireflags',
    }

class rpmSuggests(Dependency):
    # More mappings
    tagMap = {
        'name'      : 'suggestsname',
        'version'   : 'suggestsversion',
        'flags'     : 'suggestsflags',
    }

class rpmRecommends(Dependency):
    # More mappings
    tagMap = {
        'name'      : 'suggestsname',
        'version'   : 'suggestsversion',
        'flags'     : 'suggestsflags',
    }

class rpmSupplements(Dependency):
    # More mappings
    tagMap = {
        'name'      : 'enhancesname',
        'version'   : 'enhancesversion',
        'flags'     : 'enhancesflags',
    }

class rpmConflicts(Dependency):
    # More mappings
    tagMap = {
        'name'      : 'conflictname',
        'version'   : 'conflictversion',
        'flags'     : 'conflictflags',
    }

class rpmObsoletes(Dependency):
    # More mappings
    tagMap = {
        'name'      : 'obsoletename',
        'version'   : 'obsoleteversion',
        'flags'     : 'obsoleteflags',
    }

class rpmChangeLog(ChangeLog):
    tagMap = {
        'name'  : 'changelogname',
        'text'  : 'changelogtext',
        'time'  : 'changelogtime',
    }

    def populate(self, hash):
        ChangeLog.populate(self, hash)
        # Fix the time
        tm = self['time']
        if type(tm) in (IntType, LongType):
            # A UNIX timestamp
            self['time'] = gmtime(tm)
        # In changelog, data is either in UTF-8, or in any other
        # undetermined encoding. Assume ISO-Latin-1 if not UTF-8.
        for i in ('text', 'name'):
            try:
                self[i] = unicode(self[i], "utf-8")
            except UnicodeDecodeError:
                self[i] = unicode(self[i], "iso-8859-1")

def sanitizePath(path):
    if not path:
        return ""
    while path:
        if path[-1] != '/':
            break
        path = path[:-1]
    return path

def sanitizeList(l):
    if l is None:
         return []
    if type(l) in (ListType, TupleType):
        return l
    return [l]

def createPackage(header, size, checksum_type, checksum, relpath, org_id, header_start,
    header_end, channels):
    """
    Returns a populated instance of rpmBinaryPackage or rpmSourcePackage
    """
    if header.is_source:
        log_debug(4, "Creating source package")
        p = rpmSourcePackage()
    else:
        log_debug(4, "Creating package")
        p = rpmBinaryPackage()

    # bug #524231 - we need to call fullFilelist() for RPM v3 file list
    # to expand correctly
    header.hdr.fullFilelist()
    p.populate(header, size, checksum_type, checksum, relpath, org_id, header_start, header_end,
        channels)
    return p

def createPackageFromFile(filePath, relpath, org_id, channels, source=0):
    """
    Returns a populated instance of rpmBinaryPackage or rpmSourcePackage
    """
    if source:
        p = rpmSourcePackage()
    else:
        p = rpmBinaryPackage()

    p.populateFromFile(filePath, relpath, org_id, channels)
    return p
