-- oracle equivalent source sha1 785e5edad31166ff190d9cc2fd4d018624835eee

create or replace function rhn_actionks_mod_trig_fun() returns trigger as
$$
begin
	new.modified := current_timestamp;
	return new;
end;
$$ language plpgsql;

create trigger       
rhn_actionks_mod_trig
before insert or update on rhnActionKickstart
for each row
execute procedure rhn_actionks_mod_trig_fun();
