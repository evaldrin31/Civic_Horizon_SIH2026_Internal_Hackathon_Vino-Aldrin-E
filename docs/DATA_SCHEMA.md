# Accessibility Data Schema --- V1 Draft

## Core principle

Do not store only `venue.accessible = true`.

The core unit is: **a specific accessibility attribute about a specific
place/part of a venue, backed by evidence.**

## Venue

-   venue_id
-   name
-   category
-   address
-   city
-   state
-   country
-   latitude
-   longitude
-   official_url/contact where permitted
-   created_at
-   updated_at

## Venue Part / Location

Used when a feature applies to a specific entrance or area. -
location_id - venue_id - name - type - description - coordinates if
useful

Examples: Main entrance, east entrance, parking entrance, accessible
toilet, platform 2.

## Accessibility Attribute

-   attribute_id
-   venue_id
-   location_id (nullable)
-   category
-   attribute_name
-   value
-   value_type
-   notes
-   last_observed_at
-   status

Where appropriate, values use: - YES - NO - UNKNOWN

Missing evidence must not become NO.

## Candidate categories

### Mobility

step_free_entrance, ramp, ramp_location, ramp_gradient, handrail,
entrance_width, elevator, accessible_toilet, accessible_parking,
accessible_seating

### Visual

tactile_path, braille_signage, high_contrast_signage, audio_guidance,
accessible_lift_controls

### Hearing

visual_alerts, hearing_loop, sign_language_support

### General

accessible_dropoff, accessible_service_counter, staff_assistance,
accessibility_contact

Final attributes must be validated against applicable Indian
accessibility standards.

## Evidence

-   evidence_id
-   attribute_id
-   source_id
-   source_type
-   source_reference
-   evidence_text
-   evidence_media_reference if available
-   observed_at
-   collected_at
-   collector
-   verification_status
-   confidence
-   notes

## Verification states

UNVERIFIED, REPORTED, CORROBORATED, VERIFIED, CONFLICTING, OUTDATED

Confidence expresses evidence strength; the formula is TBD and must be
documented before production use.
