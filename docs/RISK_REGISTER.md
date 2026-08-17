# Risk Register

  ----------------------------------------------------------------------------------------------
  ID         Risk                           Impact     Likelihood Mitigation          Status
  ---------- ---------------------- -------------- -------------- ------------------- ----------
  R1         Insufficient real                High           High Start data research Open
             accessibility data                                   early; bounded      
                                                                  geography           

  R2         Incorrect/unverified         Critical         Medium Evidence +          Open
             claims                                               verification +      
                                                                  freshness           

  R3         Source licensing/API             High         Medium Verify terms before Open
             restrictions                                         ingestion           

  R4         Review data cannot be            High         Medium Verify API/terms    Open
             reused as assumed                                    first               

  R5         Late schema changes              High         Medium Freeze schema       Open
                                                                  before              
                                                                  implementation      

  R6         Parallel agents                  High         Medium Ownership + API     Open
             conflict                                             contract + Git      
                                                                  branches            

  R7         AI/CV false positives            High         Medium AI remains          Open
                                                                  unverified until    
                                                                  validated           

  R8         Scope too large                  High           High Bounded MVP first   Open

  R9         Geolocation errors             Medium         Medium Validate            Open
                                                                  coordinates/venue   
                                                                  identity            

  R10        Demo relies on               Critical         Medium Prioritize real     Open
             generic/mock data                                    evidence-backed     
                                                                  records             
  ----------------------------------------------------------------------------------------------
