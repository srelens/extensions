import copy
import unittest
from scripts.catalog import validate
ENTRY = {"id":"org.srelens.flux","name":"Flux","description":"Native Flux views","repository":"https://github.com/srelens/extension-flux","license":"MIT","release":{"version":"0.2.0","manifestUrl":"https://github.com/srelens/extension-flux/releases/download/v0.2.0/manifest.json","sha256":"a"*64,"srelensApiVersion":"^0.1","prerelease":True},"testedHost":{"repository":"https://github.com/srelens/srelens","revision":"b"*40}}
class CatalogTests(unittest.TestCase):
    def test_accepts_external_community_repository(self):
        entry=copy.deepcopy(ENTRY); entry['repository']='https://github.com/community/flux'
        validate([entry])
    def test_rejects_duplicate_ids(self):
        with self.assertRaises(ValueError): validate([ENTRY,ENTRY])
    def test_rejects_missing_and_unknown_fields(self):
        for key in ENTRY:
            entry=copy.deepcopy(ENTRY);del entry[key]
            with self.subTest(key=key),self.assertRaises(ValueError):validate([entry])
        with self.assertRaises(ValueError):validate([dict(ENTRY,permissions=['*'])])
    def test_rejects_unsafe_urls_and_bad_integrity(self):
        for url in ['http://example.com/file','https://user:password@example.com/file','file:///tmp/manifest','https://example.com/a#fragment']:
            entry=copy.deepcopy(ENTRY);entry['release']['manifestUrl']=url
            with self.subTest(url=url),self.assertRaises(ValueError):validate([entry])
        for value in ['', 'abc','A'*64]:
            entry=copy.deepcopy(ENTRY);entry['release']['sha256']=value
            with self.assertRaises(ValueError):validate([entry])
    def test_rejects_invalid_identity_and_version(self):
        for field,value in [('id','../flux'),('license',''),('name','')]:
            entry=dict(ENTRY);entry[field]=value
            with self.assertRaises(ValueError):validate([entry])
        entry=copy.deepcopy(ENTRY);entry['release']['version']='latest'
        with self.assertRaises(ValueError):validate([entry])
        entry=copy.deepcopy(ENTRY);entry['release']['prerelease']='true'
        with self.assertRaises(ValueError):validate([entry])
