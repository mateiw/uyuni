-- created by Oraschemadoc Thu Apr 21 10:03:32 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHNSERVERGROUPTYPEFEATURE" 
   (	"SERVER_GROUP_TYPE_ID" NUMBER NOT NULL ENABLE, 
	"FEATURE_ID" NUMBER NOT NULL ENABLE, 
	"CREATED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	"MODIFIED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_SGT_SGID_FK" FOREIGN KEY ("SERVER_GROUP_TYPE_ID")
	  REFERENCES "SPACEWALK"."RHNSERVERGROUPTYPE" ("ID") ENABLE, 
	 CONSTRAINT "RHN_SGT_FID_FK" FOREIGN KEY ("FEATURE_ID")
	  REFERENCES "SPACEWALK"."RHNFEATURE" ("ID") ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
