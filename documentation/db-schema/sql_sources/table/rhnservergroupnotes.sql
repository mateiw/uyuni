-- created by Oraschemadoc Thu Apr 21 10:03:32 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE TABLE "SPACEWALK"."RHNSERVERGROUPNOTES" 
   (	"ID" NUMBER NOT NULL ENABLE, 
	"CREATOR" NUMBER, 
	"SERVER_GROUP_ID" NUMBER NOT NULL ENABLE, 
	"SUBJECT" VARCHAR2(80) NOT NULL ENABLE, 
	"NOTE" VARCHAR2(4000) NOT NULL ENABLE, 
	"CREATED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	"MODIFIED" DATE DEFAULT (sysdate) NOT NULL ENABLE, 
	 CONSTRAINT "RHN_SERVERGRP_NOTE_ID_PK" PRIMARY KEY ("ID")
  USING INDEX PCTFREE 10 INITRANS 2 MAXTRANS 255 COMPUTE STATISTICS
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS"  ENABLE, 
	 CONSTRAINT "RHN_SERVERGRP_NOTE_CREATOR_FK" FOREIGN KEY ("CREATOR")
	  REFERENCES "SPACEWALK"."WEB_CONTACT" ("ID") ON DELETE SET NULL ENABLE, 
	 CONSTRAINT "RHN_SERVERGRP_NOTE_FK" FOREIGN KEY ("SERVER_GROUP_ID")
	  REFERENCES "SPACEWALK"."RHNSERVERGROUP" ("ID") ON DELETE CASCADE ENABLE
   ) PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT)
  TABLESPACE "USERS" ENABLE ROW MOVEMENT 
 
/
