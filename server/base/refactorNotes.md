Moving away from keeping state on the server. Should have an api that feeds into a database that keeps track of independent testing runs. Should get initial state and then keep a list of deltas.

Should have business objects that can represent relationships and can calculate certain states calculated off a given point in time.

Need to have caching in mind so we can effectively time-travel the UI without unnecessary api calls.

