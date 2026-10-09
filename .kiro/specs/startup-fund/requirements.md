# Requirements Document

## Introduction

StartupFund is a MERN stack platform that connects founders with investors. Founders register, create startup profiles with funding requirements, and manage them. Investors register, browse, search, filter, view, and shortlist startups. The platform provides role-based access, JWT authentication, form validation, error handling, and a responsive UI built with React and Tailwind CSS.

The scope is intentionally small to be achievable within 72 hours. It covers authentication and roles, founder startup management, investor discovery and shortlisting, founder and investor dashboards, and a startup details page.

## Glossary

- **StartupFund**: The platform application, consisting of the API_Server and the Web_Client
- **User**: A registered account, holding the role of Founder or Investor
- **Founder**: A registered User role that creates and manages Startup_Profiles
- **Investor**: A registered User role that browses, searches, filters, views, and shortlists Startup_Profiles
- **Startup_Profile**: A record capturing company name, tagline, description, industry, funding stage, funding required, location, website, and founder name
- **Shortlist**: A saved collection of Startup_Profiles associated with an Investor
- **JWT**: JSON Web Token issued upon login and used to authenticate protected requests
- **API_Server**: The Express.js REST API server (Node.js) backed by MongoDB with Mongoose
- **Web_Client**: The React.js single-page frontend styled with Tailwind CSS
- **Auth_System**: The subsystem handling registration, login, role assignment, and JWT management
- **Startup_Service**: The backend subsystem handling Startup_Profile CRUD operations
- **Discovery_Service**: The backend subsystem handling browse, search, and filter operations over Startup_Profiles
- **Shortlist_Service**: The backend subsystem handling Investor shortlist operations
- **Validation_System**: The subsystem validating input on both the Web_Client and the API_Server
- **Error_Handler**: The subsystem producing structured error responses and user-facing error messages
- **Funding_Stage**: A startup's funding category, e.g., Pre-Seed, Seed, Series A, Series B

## Requirements

### Requirement 1: User Registration with Role Selection

**User Story:** As a prospective User, I want to register as a Founder or Investor so that I can access role-specific features.

#### Acceptance Criteria

1. WHEN a User submits a registration form with a name between 1 and 100 characters, a syntactically valid email address, a password of 6 to 128 characters, and a role of either Founder or Investor, THE Auth_System SHALL create the account and return a JWT
2. IF a registration request omits a required field, provides a name outside the range of 1 to 100 characters, provides an email address that is not in a valid email format, or provides a role other than Founder or Investor, THEN THE Validation_System SHALL reject the request with a field-specific error message indicating which field failed validation
3. IF a registration request uses an email already registered, THEN THE Auth_System SHALL reject the request with a conflict error
4. IF a registration request provides a password shorter than 6 or longer than 128 characters, THEN THE Validation_System SHALL reject the request with an error message indicating the password length requirement
5. THE Auth_System SHALL include the User id and role claims in every JWT issued at registration

### Requirement 2: User Login

**User Story:** As a registered User, I want to log in so that I can access protected features.

#### Acceptance Criteria

1. WHEN a User submits an email and password matching a registered User's credentials, THE Auth_System SHALL return a JWT that remains valid for 24 hours after issuance and the User profile
2. IF a User submits an email or password that does not match a registered User's credentials, THEN THE Auth_System SHALL return a single generic authentication error indicating the credentials are invalid, without revealing which field failed
3. WHEN the Auth_System returns a JWT upon successful login, THE Web_Client SHALL store the JWT
4. WHEN the Web_Client sends a protected request, THE Web_Client SHALL include the stored JWT in the Authorization header

### Requirement 3: JWT Authentication and Protected Routes

**User Story:** As a developer, I want protected routes so that only authenticated Users with the correct role can access restricted features.

#### Acceptance Criteria

1. WHEN a request to a protected endpoint is received with an invalid JWT, defined as absent, expired, malformed, or having an unverifiable signature, THE API_Server SHALL reject the request with a 401 status
2. WHEN a request to a Founder-only endpoint is received with a JWT whose role claim is Investor, THE API_Server SHALL reject the request with a 403 status
3. WHEN a request to an Investor-only endpoint is received with a JWT whose role claim is Founder, THE API_Server SHALL reject the request with a 403 status
4. WHEN the Web_Client detects no JWT is present, THE Web_Client SHALL redirect the User to the login page instead of navigating to the protected page
5. WHEN a request to a role-protected endpoint is received with a JWT whose role claim is absent or does not match a recognized role, THE API_Server SHALL reject the request with a 403 status

### Requirement 4: Founder Creates a Startup Profile

**User Story:** As a Founder, I want to create a Startup_Profile so that investors can discover the startup.

#### Acceptance Criteria

1. WHEN a Founder submits a valid Startup_Profile form, THE Startup_Service SHALL create the Startup_Profile, associate the Startup_Profile with the Founder, and return the created record containing the Startup_Profile identifier and all submitted field values
2. THE Startup_Profile SHALL capture company name (required, max 200 characters), tagline (required, max 200 characters), description (required, max 2,000 characters), industry (required, max 100 characters), funding stage (required, one of: Pre-Seed, Seed, Series A, Series B, Series C, Post-Series C), funding required (required, a number between 0.01 and 999,999,999.99 with at most 2 decimal places), location (required, max 200 characters), website (optional, max 2,048 characters), and founder name (required, max 200 characters)
3. IF a Startup_Profile form omits a required field, THEN THE Validation_System SHALL reject the request with a field-specific error message
4. THE Validation_System SHALL enforce that funding required is a number between 0.01 and 999,999,999.99 with at most 2 decimal places
5. WHERE a website is provided, THE Validation_System SHALL enforce that the website is a valid URL format with a maximum length of 2,048 characters
6. IF a Startup_Profile form provides a funding required value that is not a positive number, THEN THE Validation_System SHALL reject the request with an error message indicating that funding required must be a positive number
7. IF a Startup_Profile form provides a website that is not in a valid URL format, THEN THE Validation_System SHALL reject the request with an error message indicating that the website must be a valid URL

### Requirement 5: Founder Edits a Startup Profile

**User Story:** As a Founder, I want to edit a Startup_Profile so that the information stays current.

#### Acceptance Criteria

1. WHEN a Founder submits an update for a Startup_Profile that Founder owns, THEN THE Startup_Service SHALL update the record and return the updated Startup_Profile with all current field values
2. IF a Founder submits an update for a Startup_Profile the Founder does not own, THEN THE Startup_Service SHALL reject the request with a 403 status
3. IF an update omits a required field of the Startup_Profile, THEN THE Validation_System SHALL reject the request with an error message indicating the missing field
4. IF a Founder submits an update for a Startup_Profile that does not exist, THEN THE Startup_Service SHALL reject the request with an error indicating the Startup_Profile was not found
5. IF an update includes a field value that does not meet the field's validation constraints, THEN THE Validation_System SHALL reject the request with an error message indicating the field and the reason for rejection

### Requirement 6: Founder Deletes a Startup Profile

**User Story:** As a Founder, I want to delete a Startup_Profile so that outdated or incorrect listings can be removed.

#### Acceptance Criteria

1. WHEN a Founder requests deletion of a Startup_Profile that Founder owns, THE Startup_Service SHALL delete the record and return a success confirmation identifying the deleted Startup_Profile
2. IF a Founder requests deletion of a Startup_Profile the Founder does not own, THEN THE Startup_Service SHALL reject the request with a 403 status
3. WHEN a Startup_Profile is deleted, THE Startup_Service SHALL remove the Startup_Profile from every Investor's Shortlist
4. IF a Founder requests deletion of a Startup_Profile that does not exist, THEN THE Startup_Service SHALL reject the request with an error indicating the Startup_Profile was not found
5. IF removal of a deleted Startup_Profile from an Investor's Shortlist fails, THE Startup_Service SHALL retain the deletion of the Startup_Profile and continue processing the remaining Shortlists

### Requirement 7: Founder Dashboard

**User Story:** As a Founder, I want a dashboard so that I can view and manage all Startup_Profiles in one place.

#### Acceptance Criteria

1. WHEN a Founder opens the dashboard, THE Web_Client SHALL display all Startup_Profiles owned by that Founder, showing the company name for each Startup_Profile
2. THE Web_Client SHALL provide actions to create, edit, and delete each Startup_Profile from the dashboard
3. WHEN a Founder opens the dashboard, IF the Founder has no Startup_Profiles, THEN THE Web_Client SHALL display an empty state prompting profile creation
4. WHEN a Founder selects the delete action for a Startup_Profile, THE Web_Client SHALL display a confirmation prompt before deleting the Startup_Profile
5. WHEN a Founder selects the create or edit action, THE Web_Client SHALL navigate the Founder to the Startup_Profile form
6. WHEN a Founder creates, edits, or deletes a Startup_Profile, THE Web_Client SHALL refresh the dashboard list to reflect the changes

### Requirement 8: Investor Browses Startups

**User Story:** As an Investor, I want to browse Startup_Profiles so that I can discover investment opportunities.

#### Acceptance Criteria

1. WHEN an Investor opens the browse page, THE Discovery_Service SHALL return a paginated list of Startup_Profiles ordered by most recently created, with a maximum of 20 Startup_Profiles per page
2. WHEN the Discovery_Service returns a list of Startup_Profiles, THE Web_Client SHALL display each Startup_Profile with company name, tagline, industry, funding stage, and funding required
3. WHEN the total number of Startup_Profiles exceeds 20, THE Discovery_Service SHALL return results in pages of a maximum of 20 Startup_Profiles each
4. WHEN the total number of Startup_Profiles exceeds 20, THE Web_Client SHALL provide pagination controls that enable the Investor to navigate to other pages of results
5. IF no Startup_Profiles are available, THEN THE Web_Client SHALL display a message indicating that no startup profiles are currently available
6. IF the Discovery_Service fails to return Startup_Profiles, THEN THE Web_Client SHALL display an error message indicating that the startup profiles could not be loaded

### Requirement 9: Investor Searches Startups

**User Story:** As an Investor, I want to search Startup_Profiles by keyword so that I can find relevant companies.

#### Acceptance Criteria

1. WHEN an Investor submits a search query of 1 to 200 characters, THE Discovery_Service SHALL return up to 50 Startup_Profiles whose company name, tagline, or description contain the query, matched case-insensitively, ordered alphabetically by company name
2. WHEN a search query returns no matches, THE Web_Client SHALL display a message indicating that no Startup_Profiles were found
3. IF an Investor submits a search query that is empty, contains only whitespace, or exceeds 200 characters, THEN THE Web_Client SHALL display a message indicating that the search query must be between 1 and 200 characters

### Requirement 10: Investor Filters Startups

**User Story:** As an Investor, I want to filter Startup_Profiles by industry and funding stage so that I can narrow to relevant opportunities.

#### Acceptance Criteria

1. WHEN an Investor selects one or more industry filters, THE Discovery_Service SHALL return only Startup_Profiles matching the selected industries
2. WHEN an Investor selects one or more funding stage filters, THE Discovery_Service SHALL return only Startup_Profiles matching the selected funding stages
3. WHEN an Investor applies both industry and funding stage filters, THE Discovery_Service SHALL return Startup_Profiles matching all active filters
4. IF no Startup_Profiles match the active filters, THEN THE Web_Client SHALL display a message indicating that no Startup_Profiles match the active filters
5. WHEN an Investor clears all active filters, THE Discovery_Service SHALL return the full unfiltered list of Startup_Profiles

### Requirement 11: Startup Details Page

**User Story:** As a User, I want to view a Startup_Profile's full details so that I can evaluate the opportunity.

#### Acceptance Criteria

1. WHEN a User opens a Startup_Profile details page, THEN THE Web_Client SHALL display company name, tagline, description, industry, funding stage, funding required, location, website, and founder name
2. IF a User requests a Startup_Profile that does not exist, THEN THE API_Server SHALL return a 404 status and the Web_Client SHALL display a not-found message
3. IF a User is a Founder or an Investor, THEN THE Web_Client SHALL allow the User to view the Startup details page
4. IF a User is not a Founder and not an Investor, THEN THE Web_Client SHALL deny access to the Startup details page and display a message indicating access is restricted
5. WHEN a Startup_Profile exists with one or more fields that have no value, THEN THE Web_Client SHALL render the details page and display those fields as empty

### Requirement 12: Investor Shortlists Startups

**User Story:** As an Investor, I want to shortlist Startup_Profiles so that I can save opportunities for later review.

#### Acceptance Criteria

1. WHEN an Investor adds a Startup_Profile to the Shortlist, THE Shortlist_Service SHALL save the association and return a success confirmation identifying the Startup_Profile added to the Shortlist
2. WHEN an Investor adds a Startup_Profile already present in the Shortlist, THE Shortlist_Service SHALL return a success response indicating that the Startup_Profile is already in the Shortlist without creating a duplicate entry
3. WHEN an Investor removes a Startup_Profile from the Shortlist, THE Shortlist_Service SHALL remove the association and return a success confirmation identifying the Startup_Profile removed from the Shortlist
4. IF a Founder attempts to add or remove Startup_Profiles from the Shortlist, THEN THE API_Server SHALL reject the request with a 403 status
5. IF an Investor attempts to add a Startup_Profile that does not exist to the Shortlist, THEN THE Shortlist_Service SHALL reject the request with an error indicating the Startup_Profile was not found
6. IF an Investor attempts to remove a Startup_Profile that is not in the Shortlist, THEN THE Shortlist_Service SHALL reject the request with an error indicating the Startup_Profile is not in the Shortlist

### Requirement 13: Investor Dashboard

**User Story:** As an Investor, I want a dashboard so that I can view and manage the Shortlist.

#### Acceptance Criteria

1. WHEN an Investor opens the dashboard, THEN THE Web_Client SHALL display all Startup_Profiles in that Investor's Shortlist
2. THE Web_Client SHALL provide an action to remove a Startup_Profile from the Shortlist
3. WHEN the Shortlist is empty, THEN THE Web_Client SHALL display an empty state prompting the Investor to browse startups
4. WHEN an Investor triggers the remove action for a Startup_Profile in the Shortlist, THEN THE Web_Client SHALL remove that Startup_Profile from the Investor's Shortlist and update the displayed list to reflect the removal
5. IF removal of a Startup_Profile from the Shortlist fails, THEN THE Web_Client SHALL retain the Startup_Profile in the Shortlist and display an error message indicating that the removal failed
6. IF loading the Shortlist fails when an Investor opens the dashboard, THEN THE Web_Client SHALL display an error message indicating that the Shortlist could not be loaded

### Requirement 14: Form Validation

**User Story:** As a User, I want form validation so that I receive immediate feedback on invalid input.

#### Acceptance Criteria

1. WHEN a User attempts to submit a form, IF one or more required fields are missing or invalid, THEN THE Web_Client SHALL prevent form submission and display a field-specific error message for each specific field that failed validation
2. WHEN the API_Server receives a request, IF one or more inputs fail validation, THEN THE API_Server SHALL reject the submission with an error message that identifies each field that failed validation
3. IF a form input fails validation, THEN THE Validation_System SHALL return an error message naming the field that failed and indicating the reason for the validation failure
4. IF a registration or login form receives a non-empty email value that does not contain text before and after an '@' symbol, THEN THE Validation_System SHALL reject the input with an error message indicating the email format is invalid
5. WHEN the API_Server rejects a request due to validation errors, THE Web_Client SHALL display the field-specific error messages returned by the API_Server on the current form
6. WHEN a User moves focus away from a form field without submitting the form, IF the field value is invalid, THEN THE Web_Client SHALL display a field-specific error message for that field without requiring form submission

### Requirement 15: Error Handling

**User Story:** As a User, I want clear error handling so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN the API_Server encounters an error, THEN THE Error_Handler SHALL return a structured JSON response containing an error type identifier and a human-readable error message describing the cause of the error
2. WHEN a network or server error occurs, THEN THE Web_Client SHALL display an error message visible to the User on the current screen that describes the nature of the error in non-technical terms understandable to a User without programming knowledge
3. WHEN a JWT is expired or invalid, THEN THE Web_Client SHALL display an error message indicating that the session has expired and redirect the User to the login page
4. IF the Error_Handler encounters an error, THEN THE Error_Handler SHALL return the structured JSON error response with the corresponding status code: 400 for validation errors, 401 for authentication failures, 403 for authorization failures, 404 for not found errors, or 500 for server errors

### Requirement 16: Responsive UI

**User Story:** As a User, I want a responsive interface so that I can use StartupFund on mobile and desktop.

#### Acceptance Criteria

1. THE Web_Client SHALL render all pages using Tailwind CSS such that, at mobile viewport widths below 768 pixels, tablet viewport widths from 768 to 1023 pixels, and desktop viewport widths of 1024 pixels and above, page content fits within the viewport width without horizontal scrolling and all interactive elements remain visible without clipping.
2. WHILE the viewport width is below 768 pixels, THE Web_Client SHALL display the navigation as a collapsible menu that is collapsed by default and hides the full set of navigation links from view.
3. WHILE the viewport width is below 768 pixels, THE Web_Client SHALL display all forms such that every input field, associated label, and submit control remains visible within the viewport width without horizontal scrolling and no form element is clipped or overlaps another element.
4. WHEN the user activates the navigation menu toggle at a viewport width below 768 pixels, THE Web_Client SHALL toggle the collapsible menu between collapsed and expanded states, displaying the full set of navigation links when expanded and hiding them when collapsed.

### Requirement 17: Startup Profile Serialization Round-Trip

**User Story:** As a developer, I want reliable Startup_Profile serialization so that data is preserved across API boundaries.

#### Acceptance Criteria

1. THE Startup_Service SHALL serialize all fields of Startup_Profile records to JSON for API responses
2. WHEN a persisted Startup_Profile record is retrieved by id, THE Startup_Service SHALL return every field value equal to the originally stored value, including fields containing null, empty-string, and string values up to 1,024 characters
3. WHEN a Startup_Profile is created and retrieved within 5 seconds of creation, THE Startup_Service SHALL return a record with every field value equal to the corresponding submitted input value
