-- created by Oraschemadoc Thu Apr 21 10:04:16 2011
-- visit http://www.yarpen.cz/oraschemadoc/ for more info

  CREATE OR REPLACE TRIGGER "SPACEWALK"."RHN_ACT_KEY_MOD_TRIG" 
before insert or update on rhnActivationKey
for each row
begin
        :new.modified := sysdate;
end;
ALTER TRIGGER "SPACEWALK"."RHN_ACT_KEY_MOD_TRIG" ENABLE
 
/
