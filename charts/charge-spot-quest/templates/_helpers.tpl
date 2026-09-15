{{/* Expand the chart name. */}}
{{- define "charge-spot-quest.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Create a release-scoped name. */}}
{{- define "charge-spot-quest.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "charge-spot-quest.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/* Standard Kubernetes labels. */}}
{{- define "charge-spot-quest.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | quote }}
{{ include "charge-spot-quest.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service | quote }}
{{- end }}

{{/* Selector labels. */}}
{{- define "charge-spot-quest.selectorLabels" -}}
app.kubernetes.io/name: {{ include "charge-spot-quest.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Resolve the image reference, preferring an immutable digest. */}}
{{- define "charge-spot-quest.image" -}}
{{- if .Values.image.digest }}
{{- printf "%s@%s" .Values.image.repository .Values.image.digest }}
{{- else }}
{{- printf "%s:%s" .Values.image.repository (.Values.image.tag | toString) }}
{{- end }}
{{- end }}

{{/* App Secret name (holds DATABASE_URL). */}}
{{- define "charge-spot-quest.secretName" -}}
{{- if and (not .Values.secrets.create) .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- include "charge-spot-quest.fullname" . }}
{{- end }}
{{- end }}

{{/* Bundled Postgres resource name. */}}
{{- define "charge-spot-quest.postgres.fullname" -}}
{{- printf "%s-postgresql" (include "charge-spot-quest.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Bundled Postgres auth Secret (defaults to app Secret with POSTGRES_* keys). */}}
{{- define "charge-spot-quest.postgres.secretName" -}}
{{- if .Values.postgresql.auth.existingSecret }}
{{- .Values.postgresql.auth.existingSecret }}
{{- else }}
{{- include "charge-spot-quest.secretName" . }}
{{- end }}
{{- end }}

{{/* Postgres host for DATABASE_URL. */}}
{{- define "charge-spot-quest.dbHost" -}}
{{- if .Values.postgresql.enabled }}
{{- include "charge-spot-quest.postgres.fullname" . }}
{{- else }}
{{- .Values.externalDatabase.host }}
{{- end }}
{{- end }}

{{/* Postgres port. */}}
{{- define "charge-spot-quest.dbPort" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.service.port | default 5432 }}
{{- else }}
{{- .Values.externalDatabase.port | default 5432 }}
{{- end }}
{{- end }}

{{/* Postgres user. */}}
{{- define "charge-spot-quest.dbUser" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.username }}
{{- else }}
{{- .Values.externalDatabase.user }}
{{- end }}
{{- end }}

{{/* Postgres database name. */}}
{{- define "charge-spot-quest.dbName" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.database }}
{{- end }}
{{- end }}

{{/*
  Resolve password for chart-managed DATABASE_URL.
  Prefer values; if bundled and password empty, use a stable lookup/generate.
*/}}
{{- define "charge-spot-quest.dbPassword" -}}
{{- if .Values.postgresql.enabled }}
{{- if .Values.postgresql.auth.password }}
{{- .Values.postgresql.auth.password }}
{{- else }}
{{- $secret := (lookup "v1" "Secret" .Release.Namespace (include "charge-spot-quest.postgres.secretName" .)) }}
{{- if and $secret $secret.data (index $secret.data "password") }}
{{- index $secret.data "password" | b64dec }}
{{- else }}
{{- randAlphaNum 24 }}
{{- end }}
{{- end }}
{{- else }}
{{- .Values.externalDatabase.password }}
{{- end }}
{{- end }}
