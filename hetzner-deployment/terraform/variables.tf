variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "autoscale-ai"
}

variable "server_location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1"  # Nuremberg
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "ccx33"  # 8 vCPU, 16GB RAM
}

variable "volume_size" {
  description = "Volume size in GB"
  type        = number
  default     = 50
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/hetzner_autoscale.pub"
}
